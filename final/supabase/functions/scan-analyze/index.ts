import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const RISK_LEVELS = ["reassuring", "watch", "see_doctor_soon", "see_doctor_urgently"] as const;
type RiskLevel = (typeof RISK_LEVELS)[number];
const RECHECK_DAYS: Record<RiskLevel, number> = { reassuring: 180, watch: 30, see_doctor_soon: 7, see_doctor_urgently: 1 };

const SYSTEM_PROMPT = `You are SkinScan AI, a calm, supportive skin-awareness companion. You are NOT a doctor and you do NOT diagnose.
STRICT TONE RULES: Never use: cancer, malignant, carcinoma, melanoma, tumour, tumor, biopsy, diagnosis, lesion.
Use plain, calming language. Never be definitive. Always include the disclaimer.
Reply with ONLY valid JSON — no markdown, no commentary.
Risk levels: "reassuring", "watch", "see_doctor_soon", "see_doctor_urgently".
ABCDE flags: asymmetry, border, color, diameter, evolving. Each: {present: boolean, note: string}.`;

async function sha256(message: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
}
async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + key), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}
async function signBedrockRequest(accessKeyId: string, secretAccessKey: string, region: string, body: string) {
  const modelId = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";
  const host = `bedrock-runtime.${region}.amazonaws.com`;
  const path = `/model/${encodeURIComponent(modelId)}/invoke`;
  const url = `https://${host}${path}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256(body);
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-date";
  const canonicalRequest = ["POST", path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/bedrock/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256(canonicalRequest)].join("\n");
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, "bedrock");
  const signatureBytes = await hmacSha256(signingKey, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, "0")).join("");
  return { url, headers: { "Content-Type": "application/json", "X-Amz-Date": amzDate, "Authorization": `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}` } };
}

Deno.serve(async (req) => {
  console.log("Function started");
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
    const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const AWS_REGION = Deno.env.get("AWS_REGION") || "us-east-1";
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) return json({ error: "AWS credentials not configured" }, 500);

    const supabaseUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser(authHeader.slice(7));
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;
    console.log("User authenticated:", userId);

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid JSON body" }, 400);
    const { image_base64, image_mime, body_location, body_location_label, nickname, spot_id, duration_present, has_changed, change_description, symptoms, additional_notes } = body as Record<string, string | boolean | undefined>;

    if (typeof image_base64 !== "string" || image_base64.length < 100) return json({ error: "Image is required" }, 400);
    if (typeof image_mime !== "string" || !["image/jpeg", "image/png"].includes(image_mime)) return json({ error: "Image must be JPEG or PNG" }, 400);
    if (typeof body_location !== "string" || !body_location) return json({ error: "body_location required" }, 400);
    if (typeof body_location_label !== "string") return json({ error: "body_location_label required" }, 400);

    console.log("Uploading image");
    const bytes = Uint8Array.from(atob(image_base64), (c) => c.charCodeAt(0));
    const filename = `${userId}/${crypto.randomUUID()}.${image_mime === "image/png" ? "png" : "jpg"}`;
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE);
    const { error: upErr } = await supabaseAdmin.storage.from("scans").upload(filename, bytes, { contentType: image_mime, upsert: false });
    if (upErr) { console.error("upload error", upErr); return json({ error: "Failed to store image" }, 500); }
    console.log("Image uploaded");

    const userMessage = `Analyze this skin spot photo.\n- Body location: ${body_location_label}\n- How long present: ${duration_present ?? "not specified"}\n- Has it changed: ${has_changed ? "yes" : "no"}${change_description ? ` — ${change_description}` : ""}\n- Symptoms: ${symptoms ?? "none reported"}\n- Notes: ${additional_notes ?? "none"}\n\nReturn ONLY this JSON:\n{\n  "risk_level": "reassuring"|"watch"|"see_doctor_soon"|"see_doctor_urgently",\n  "headline": string,\n  "what_we_see": string,\n  "what_this_means": string,\n  "abcde_flags": {\n    "asymmetry": {"present": boolean, "note": string},\n    "border": {"present": boolean, "note": string},\n    "color": {"present": boolean, "note": string},\n    "diameter": {"present": boolean, "note": string},\n    "evolving": {"present": boolean, "note": string}\n  },\n  "what_to_do_next": string[],\n  "recheck_in_days": number,\n  "disclaimer": "SkinScan AI is not a medical device and does not provide a diagnosis. Always consult a qualified doctor for medical advice."\n}`;

    const requestBody = JSON.stringify({ anthropic_version: "bedrock-2023-05-31", max_tokens: 1500, system: SYSTEM_PROMPT, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: image_mime, data: image_base64 } }, { type: "text", text: userMessage }] }] });
    console.log("Calling Bedrock");
    const { url, headers } = await signBedrockRequest(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, requestBody);
    const aiRes = await fetch(url, { method: "POST", headers, body: requestBody });
    console.log("Bedrock response status:", aiRes.status);
    if (!aiRes.ok) { const errText = await aiRes.text(); console.error("Bedrock error", aiRes.status, errText); return json({ error: `AI analysis failed: ${aiRes.status}` }, 502); }

    const aiJson = await aiRes.json();
    const content = aiJson.content?.[0]?.text;
    if (!content) return json({ error: "Empty AI response" }, 502);

    let parsed: any;
    try { parsed = JSON.parse(String(content).replace(/```json|```/g, "").trim()); }
    catch { const m = String(content).match(/\{[\s\S]*\}/); if (!m) return json({ error: "AI returned invalid JSON" }, 502); parsed = JSON.parse(m[0]); }

    let riskLevel: RiskLevel = RISK_LEVELS.includes(parsed.risk_level) ? parsed.risk_level : "watch";
    parsed.risk_level = riskLevel;
    parsed.disclaimer ??= "SkinScan AI is not a medical device and does not provide a diagnosis. Always consult a qualified doctor for medical advice.";
    parsed.recheck_in_days ??= RECHECK_DAYS[riskLevel];

    let resolvedSpotId = typeof spot_id === "string" && spot_id ? spot_id : null;
    let previousRisk: RiskLevel | null = null;
    if (resolvedSpotId) {
      const { data: existing } = await supabaseAdmin.from("spots").select("id,user_id,latest_risk_level").eq("id", resolvedSpotId).eq("user_id", userId).maybeSingle();
      if (!existing) resolvedSpotId = null;
      else previousRisk = (existing.latest_risk_level as RiskLevel) ?? null;
    }
    if (!resolvedSpotId) {
      const nick = (typeof nickname === "string" && nickname.trim()) || `Spot on ${String(body_location_label).toLowerCase()}`;
      const nextReminder = new Date(); nextReminder.setDate(nextReminder.getDate() + parsed.recheck_in_days);
      const { data: newSpot, error: spotErr } = await supabaseAdmin.from("spots").insert({ user_id: userId, nickname: nick.slice(0, 80), body_location, body_location_label, latest_risk_level: riskLevel, reminder_frequency_days: parsed.recheck_in_days, next_reminder_date: nextReminder.toISOString() }).select("id").single();
      if (spotErr || !newSpot) return json({ error: "Failed to create spot" }, 500);
      resolvedSpotId = newSpot.id;
    } else {
      const nextReminder = new Date(); nextReminder.setDate(nextReminder.getDate() + parsed.recheck_in_days);
      await supabaseAdmin.from("spots").update({ latest_risk_level: riskLevel, next_reminder_date: nextReminder.toISOString() }).eq("id", resolvedSpotId);
    }

    const RISK_ORDER: Record<RiskLevel, number> = { reassuring: 0, watch: 1, see_doctor_soon: 2, see_doctor_urgently: 3 };
    let changeFromPrevious: string | null = null;
    if (previousRisk) { const diff = RISK_ORDER[riskLevel] - RISK_ORDER[previousRisk]; changeFromPrevious = diff > 0 ? "worsened" : diff < 0 ? "improved" : "stable"; }

    const { data: scan, error: scanErr } = await supabaseAdmin.from("scans").insert({ user_id: userId, spot_id: resolvedSpotId, image_path: filename, body_location, duration_present: (duration_present as string) ?? null, has_changed: Boolean(has_changed), change_description: (change_description as string) ?? null, symptoms: (symptoms as string) ?? null, additional_notes: (additional_notes as string) ?? null, ai_result: parsed, risk_level: riskLevel, change_from_previous: changeFromPrevious }).select("id").single();
    if (scanErr || !scan) return json({ error: "Failed to save scan" }, 500);
    console.log("Scan saved:", scan.id);
    return json({ scan_id: scan.id, spot_id: resolvedSpotId, ai_result: parsed, change_from_previous: changeFromPrevious });
  } catch (e) { console.error("scan-analyze error", e); return json({ error: "Unexpected error: " + String(e) }, 500); }
});

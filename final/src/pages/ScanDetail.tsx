import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Check, AlertCircle, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";
import { RiskBadge, type RiskLevel } from "@/components/RiskBadge";
import { supabase } from "@/integrations/supabase/client";
import { findBodyLocation } from "@/lib/bodyLocations";

interface AbcdeFlag { present: boolean; note: string }
interface AiResult {
  risk_level: RiskLevel;
  headline: string;
  what_we_see: string;
  what_this_means: string;
  abcde_flags: {
    asymmetry: AbcdeFlag;
    border: AbcdeFlag;
    color: AbcdeFlag;
    diameter: AbcdeFlag;
    evolving: AbcdeFlag;
  };
  what_to_do_next: string[];
  recheck_in_days: number;
  disclaimer: string;
}

interface Scan {
  id: string;
  spot_id: string;
  image_path: string;
  body_location: string;
  duration_present: string | null;
  has_changed: boolean;
  change_description: string | null;
  symptoms: string | null;
  additional_notes: string | null;
  ai_result: AiResult | null;
  risk_level: RiskLevel | null;
  change_from_previous: string | null;
  created_at: string;
}

const ABCDE_LABELS: Array<[keyof AiResult["abcde_flags"], string]> = [
  ["asymmetry", "Asymmetry"],
  ["border", "Border"],
  ["color", "Color"],
  ["diameter", "Diameter"],
  ["evolving", "Evolving"],
];

const ChangeChip = ({ change }: { change: string | null }) => {
  if (!change) return null;
  const map: Record<string, { Icon: typeof Minus; label: string; cls: string }> = {
    improved: { Icon: ArrowDownRight, label: "Improved since last scan", cls: "bg-risk-reassuring-bg text-risk-reassuring-fg" },
    stable: { Icon: Minus, label: "Stable since last scan", cls: "bg-secondary text-secondary-foreground" },
    worsened: { Icon: ArrowUpRight, label: "Changed since last scan", cls: "bg-risk-watch-bg text-risk-watch-fg" },
  };
  const cfg = map[change];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.cls}`}>
      <cfg.Icon size={12} /> {cfg.label}
    </span>
  );
};

const ScanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setScan(data as unknown as Scan);
      const { data: signed } = await supabase.storage
        .from("scans")
        .createSignedUrl(data.image_path, 60 * 30);
      if (!cancelled) {
        setImageUrl(signed?.signedUrl ?? null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container-narrow py-10">
          <div className="card-soft animate-pulse h-96" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !scan) {
    return (
      <AppLayout>
        <div className="container-narrow py-10 text-center">
          <h1>Scan not found</h1>
          <p className="text-sm text-muted-foreground mt-2">This scan may have been deleted, or it belongs to another account.</p>
          <Link to="/history" className="btn-primary mt-6">Back to history</Link>
        </div>
      </AppLayout>
    );
  }

  const ai = scan.ai_result;
  const risk = scan.risk_level ?? ai?.risk_level ?? "watch";
  const location = findBodyLocation(scan.body_location);
  const created = new Date(scan.created_at);

  return (
    <AppLayout>
      <Seo title={`Scan result · SkinScan AI`} description="Your AI-supported skin awareness result." />
      <div className="container-narrow py-8 max-w-2xl fade-in">
        <Link to="/history" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} /> All scans
        </Link>

        {/* Header card */}
        <section className="card-soft mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="The skin spot you uploaded"
                className="w-full sm:w-40 h-40 object-cover rounded-xl border border-border bg-muted"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <RiskBadge level={risk} />
                <ChangeChip change={scan.change_from_previous} />
              </div>
              {ai?.headline && <h1 className="text-xl mb-2">{ai.headline}</h1>}
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="inline-flex items-center gap-1.5"><MapPin size={12} /> {location?.label ?? scan.body_location}</p>
                <p className="inline-flex items-center gap-1.5"><Calendar size={12} /> {created.toLocaleDateString(undefined, { dateStyle: "long" })}</p>
              </div>
            </div>
          </div>
        </section>

        {ai && (
          <>
            <section className="card-soft mb-4">
              <h2 className="text-base font-semibold mb-2">What we see</h2>
              <p className="text-sm leading-relaxed text-foreground/90">{ai.what_we_see}</p>
            </section>

            <section className="card-soft mb-4">
              <h2 className="text-base font-semibold mb-2">What this means</h2>
              <p className="text-sm leading-relaxed text-foreground/90">{ai.what_this_means}</p>
            </section>

            <section className="card-soft mb-4">
              <h2 className="text-base font-semibold mb-3">ABCDE check</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Doctors use these five features to flag spots worth a closer look.
              </p>
              <ul className="space-y-3">
                {ABCDE_LABELS.map(([key, label]) => {
                  const flag = ai.abcde_flags?.[key];
                  if (!flag) return null;
                  const Icon = flag.present ? AlertCircle : Check;
                  const iconCls = flag.present ? "text-risk-watch-fg" : "text-risk-reassuring-fg";
                  return (
                    <li key={key} className="flex gap-3">
                      <Icon size={16} className={`flex-shrink-0 mt-0.5 ${iconCls}`} aria-hidden />
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{flag.note}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="card-soft mb-4">
              <h2 className="text-base font-semibold mb-3">What to do next</h2>
              <ol className="space-y-2.5">
                {ai.what_to_do_next?.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-light text-primary-dark font-semibold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{item}</span>
                  </li>
                ))}
              </ol>
              {ai.recheck_in_days && (
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  Suggested recheck in <span className="font-semibold text-foreground">{ai.recheck_in_days} days</span>.
                </p>
              )}
            </section>
          </>
        )}

        {(scan.duration_present || scan.has_changed || scan.symptoms || scan.additional_notes) && (
          <section className="card-soft mb-4">
            <h2 className="text-base font-semibold mb-3">Your notes</h2>
            <dl className="text-sm space-y-2">
              {scan.duration_present && (
                <div><dt className="text-xs text-muted-foreground">Duration</dt><dd>{scan.duration_present}</dd></div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">Recent change</dt>
                <dd>{scan.has_changed ? (scan.change_description || "Yes") : "No"}</dd>
              </div>
              {scan.symptoms && (
                <div><dt className="text-xs text-muted-foreground">Symptoms</dt><dd>{scan.symptoms}</dd></div>
              )}
              {scan.additional_notes && (
                <div><dt className="text-xs text-muted-foreground">Other notes</dt><dd>{scan.additional_notes}</dd></div>
              )}
            </dl>
          </section>
        )}

        <p className="text-xs text-muted-foreground bg-primary-light/40 rounded-xl p-4 leading-relaxed">
          {ai?.disclaimer ?? "SkinScan AI is not a medical device and does not provide a diagnosis. Always consult a qualified doctor for medical advice."}
        </p>
      </div>
    </AppLayout>
  );
};

export default ScanDetail;

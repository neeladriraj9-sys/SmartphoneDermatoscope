import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";
import { ImageUploader } from "@/components/ImageUploader";
import { ProgressSteps } from "@/components/ProgressSteps";
import { BODY_LOCATIONS, BODY_LOCATION_GROUPS } from "@/lib/bodyLocations";
import { supabase } from "@/integrations/supabase/client";

const DURATION_OPTIONS = [
  "Less than 1 month",
  "1–6 months",
  "6–12 months",
  "1–5 years",
  "More than 5 years",
  "Not sure",
];

const fileToBase64 = async (file: File): Promise<{ base64: string; mime: string }> => {
  // Compress image before sending to AI (max 800px width, 70% quality)
  const compressedFile = await new Promise<File>((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => { resolve(new File([blob!], file.name, { type: "image/jpeg" })); },
        "image/jpeg",
        0.7
      );
    };
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const [, base64] = result.split(",");
      resolve({ base64, mime: "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(compressedFile);
  });
};

const NewScan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Step 2
  const [bodyLocation, setBodyLocation] = useState<string>("");
  const [nickname, setNickname] = useState("");

  // Step 3
  const [duration, setDuration] = useState<string>("");
  const [hasChanged, setHasChanged] = useState<"yes" | "no" | "">("");
  const [changeDescription, setChangeDescription] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof BODY_LOCATIONS>();
    for (const loc of BODY_LOCATIONS) {
      if (!map.has(loc.group)) map.set(loc.group, []);
      map.get(loc.group)!.push(loc);
    }
    return map;
  }, []);

  const selectedLocation = BODY_LOCATIONS.find((l) => l.key === bodyLocation);

  const canNext1 = !!file;
  const canNext2 = !!bodyLocation;
  const canSubmit = !!duration && !!hasChanged && !analyzing;

  const handleSubmit = async () => {
    if (!file || !selectedLocation) return;
    setAnalyzing(true);
    try {
      const { base64, mime } = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("scan-analyze", {
        body: {
          image_base64: base64,
          image_mime: mime,
          body_location: selectedLocation.key,
          body_location_label: selectedLocation.label,
          nickname: nickname.trim() || undefined,
          duration_present: duration,
          has_changed: hasChanged === "yes",
          change_description: changeDescription.trim() || undefined,
          symptoms: symptoms.trim() || undefined,
          additional_notes: additionalNotes.trim() || undefined,
        },
      });

      if (error) {
        const msg = (error as { message?: string }).message ?? "Analysis failed";
        toast.error(msg);
        return;
      }
      if (!data?.scan_id) {
        toast.error("Could not analyze this photo. Please try again.");
        return;
      }
      toast.success("Analysis complete");
      navigate(`/scans/${data.scan_id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong analyzing your photo.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppLayout>
      <Seo title="Check a spot · SkinScan AI" description="Upload a clear photo of a skin spot for an AI awareness check." />
      <div className="container-narrow py-8 max-w-2xl">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate("/"))}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="mb-1">Check a spot</h1>
        <p className="text-sm text-muted-foreground mb-6">
          A calm, supportive look — not a diagnosis. Always consult a doctor for medical advice.
        </p>

        <div className="mb-6">
          <ProgressSteps current={step} total={3} labels={["Photo", "Location", "Context"]} />
        </div>

        {step === 1 && (
          <section className="card-soft fade-in">
            <h2 className="text-lg font-semibold mb-1">Take a clear photo</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Hold steady, good light, in focus, the spot filling most of the frame.
            </p>
            <ImageUploader file={file} preview={preview} onFileChange={setFile} />
            <div className="flex justify-end mt-6">
              <button className="btn-primary" disabled={!canNext1} onClick={() => setStep(2)}>
                Next <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="card-soft fade-in">
            <h2 className="text-lg font-semibold mb-1">Where on your body?</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Helps us track this spot over time and tailor your reminders.
            </p>

            <label className="block text-sm font-medium mb-1.5">Body location</label>
            <select
              className="input-field mb-4"
              value={bodyLocation}
              onChange={(e) => setBodyLocation(e.target.value)}
            >
              <option value="">Select a location…</option>
              {BODY_LOCATION_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {grouped.get(group)?.map((loc) => (
                    <option key={loc.key} value={loc.key}>{loc.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <label className="block text-sm font-medium mb-1.5">
              Nickname for this spot <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              className="input-field mb-2"
              placeholder={selectedLocation ? `e.g. "${selectedLocation.label} mole"` : "e.g. \"freckle on my arm\""}
              value={nickname}
              maxLength={80}
              onChange={(e) => setNickname(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Used only by you, on your scan history.</p>

            <div className="flex justify-between mt-6">
              <button className="btn-ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={14} className="mr-1" /> Back
              </button>
              <button className="btn-primary" disabled={!canNext2} onClick={() => setStep(3)}>
                Next <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="card-soft fade-in">
            <h2 className="text-lg font-semibold mb-1">A little context</h2>
            <p className="text-xs text-muted-foreground mb-4">
              These details help the AI give you a more useful read. Take your best guess where unsure.
            </p>

            <label className="block text-sm font-medium mb-1.5">How long has this spot been there?</label>
            <select className="input-field mb-4" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="">Select…</option>
              {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <label className="block text-sm font-medium mb-1.5">Has it changed recently?</label>
            <div className="flex gap-2 mb-4">
              {(["yes", "no"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setHasChanged(v)}
                  className={`flex-1 rounded-full py-2.5 text-sm font-semibold border capitalize transition ${
                    hasChanged === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:bg-primary-light"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {hasChanged === "yes" && (
              <>
                <label className="block text-sm font-medium mb-1.5">What kind of change?</label>
                <textarea
                  className="input-field mb-4"
                  rows={2}
                  placeholder="e.g. got darker, grew larger, became raised…"
                  value={changeDescription}
                  maxLength={500}
                  onChange={(e) => setChangeDescription(e.target.value)}
                />
              </>
            )}

            <label className="block text-sm font-medium mb-1.5">
              Symptoms <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              className="input-field mb-4"
              placeholder="e.g. itches, bleeds, scabs, painful…"
              value={symptoms}
              maxLength={250}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            <label className="block text-sm font-medium mb-1.5">
              Anything else? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Family history, sun exposure, anything else you'd want a doctor to know."
              value={additionalNotes}
              maxLength={500}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />

            <div className="flex justify-between mt-6">
              <button className="btn-ghost" onClick={() => setStep(2)} disabled={analyzing}>
                <ArrowLeft size={14} className="mr-1" /> Back
              </button>
              <button className="btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
                {analyzing ? (
                  <><Loader2 size={14} className="mr-1.5 animate-spin" /> Analyzing…</>
                ) : (
                  <><Sparkles size={14} className="mr-1.5" /> Analyze this spot</>
                )}
              </button>
            </div>

            {analyzing && (
              <p className="text-xs text-muted-foreground mt-4 text-center pulse-soft">
                Looking carefully at your photo — this usually takes 10–20 seconds.
              </p>
            )}
          </section>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6 px-4">
          SkinScan AI is not a medical device and does not provide a diagnosis. Always consult a qualified doctor for medical advice.
        </p>
      </div>
    </AppLayout>
  );
};

export default NewScan;

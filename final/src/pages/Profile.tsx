import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";

const SKIN_TONES = [
  { value: "I", label: "Type I", hex: "#F5D5BE", desc: "Very fair, always burns" },
  { value: "II", label: "Type II", hex: "#E8C3A1", desc: "Fair, usually burns" },
  { value: "III", label: "Type III", hex: "#D1A074", desc: "Medium, sometimes burns" },
  { value: "IV", label: "Type IV", hex: "#A47551", desc: "Olive, rarely burns" },
  { value: "V", label: "Type V", hex: "#6E4B30", desc: "Brown, very rarely burns" },
  { value: "VI", label: "Type VI", hex: "#3B2418", desc: "Deeply pigmented, never burns" },
];

const Profile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("");
  const [skinTone, setSkinTone] = useState<string>("");
  const [sunExposure, setSunExposure] = useState<string>("");
  const [familyHx, setFamilyHx] = useState(false);
  const [personalHx, setPersonalHx] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setAge(data.age?.toString() || "");
        setSkinTone(data.skin_tone || "");
        setSunExposure(data.sun_exposure || "");
        setFamilyHx(!!data.family_history_skin_cancer);
        setPersonalHx(!!data.personal_history_skin_cancer);
      }
      setLoading(false);
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const ageNum = age === "" ? null : Math.max(0, Math.min(120, Number(age) || 0));
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.slice(0, 100),
      age: ageNum,
      skin_tone: skinTone || null,
      sun_exposure: sunExposure || null,
      family_history_skin_cancer: familyHx,
      personal_history_skin_cancer: personalHx,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Could not save profile.");
    toast.success("Profile saved.");
  };

  if (loading) {
    return <AppLayout><p className="pulse-soft text-center text-muted-foreground py-8">Loading…</p></AppLayout>;
  }

  const initials = (fullName || user?.email || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <Seo title="My Profile" noindex />
      <header className="mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-display text-xl">
          {initials}
        </div>
        <div>
          <h1 className="font-display text-3xl">My profile</h1>
          <p className="text-sm text-muted-foreground">Helps us tailor your scan results.</p>
        </div>
      </header>

      <form onSubmit={save} className="card-soft space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
          <input id="email" type="email" readOnly value={user?.email || ""} className="input-field bg-muted" />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">Full name</label>
          <input id="fullName" type="text" maxLength={100} className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="age" className="block text-sm font-medium mb-1.5">Age</label>
          <input id="age" type="number" min={0} max={120} className="input-field max-w-[120px]" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div>
          <fieldset>
            <legend className="block text-sm font-medium mb-2">Skin tone (Fitzpatrick)</legend>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SKIN_TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSkinTone(t.value)}
                  className={`rounded-lg p-2 border-2 text-center transition ${
                    skinTone === t.value ? "border-primary" : "border-border"
                  }`}
                  aria-pressed={skinTone === t.value}
                >
                  <div className="w-full aspect-square rounded-md mb-1" style={{ background: t.hex }} aria-hidden />
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
            {skinTone && <p className="text-xs text-muted-foreground mt-2">{SKIN_TONES.find((t) => t.value === skinTone)?.desc}</p>}
          </fieldset>
        </div>
        <div>
          <fieldset>
            <legend className="block text-sm font-medium mb-2">Typical sun exposure</legend>
            <div className="flex gap-3 flex-wrap">
              {["low", "moderate", "high"].map((v) => (
                <label key={v} className={`px-4 py-2 rounded-full border cursor-pointer text-sm capitalize ${sunExposure === v ? "bg-primary-light border-primary text-primary-dark" : "border-border"}`}>
                  <input type="radio" name="sun" className="sr-only" value={v} checked={sunExposure === v} onChange={() => setSunExposure(v)} />
                  {v}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="space-y-2">
          <Toggle label="Family history of skin cancer" checked={familyHx} onChange={setFamilyHx} />
          <Toggle label="Personal history of skin cancer" checked={personalHx} onChange={setPersonalHx} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save changes"}</button>
      </form>
    </AppLayout>
  );
};

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer">
    <span className="text-sm">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition ${checked ? "bg-primary" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  </label>
);

export default Profile;

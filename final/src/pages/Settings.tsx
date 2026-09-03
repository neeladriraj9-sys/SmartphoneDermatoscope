import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Notification preferences (local)
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("skinscan_prefs") || "{}"); } catch { return {}; }
  });
  const setPref = (key: string, val: boolean) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem("skinscan_prefs", JSON.stringify(next));
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE ME") return toast.error('Type "DELETE ME" to confirm.');
    if (!user) return;
    await Promise.all([
      supabase.from("scans").delete().eq("user_id", user.id),
      supabase.from("spots").delete().eq("user_id", user.id),
      supabase.from("profiles").delete().eq("id", user.id),
    ]);
    signOut();
    toast.success("Your data has been deleted.");
    navigate("/login");
  };

  return (
    <AppLayout>
      <Seo title="Settings" noindex />
      <header className="mb-6">
        <h1 className="font-display text-3xl">Settings</h1>
      </header>

      <section className="card-soft mb-6">
        <h2 className="font-display text-xl mb-3">Account</h2>
        <p className="text-sm text-muted-foreground">
          Logged in as <span className="font-semibold text-foreground">{user?.email}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">Authentication is handled via OTP sent to your email.</p>
      </section>

      <section className="card-soft mb-6">
        <h2 className="font-display text-xl mb-3">Notification preferences</h2>
        <div className="space-y-3">
          <Toggle label="Scan reminders" checked={prefs.reminders !== false} onChange={(v) => setPref("reminders", v)} />
          <Toggle label="Tips and skin health updates" checked={!!prefs.tips} onChange={(v) => setPref("tips", v)} />
          <Toggle label="High-risk result alerts" checked={prefs.alerts !== false} onChange={(v) => setPref("alerts", v)} />
        </div>
      </section>

      <section className="card-soft mb-6">
        <h2 className="font-display text-xl mb-3">Privacy</h2>
        <p className="text-sm text-muted-foreground">
          Your scan images are stored privately. Only you can see them. We never share or sell your data.
        </p>
      </section>

      <section className="card-soft border-2 border-destructive/30">
        <h2 className="font-display text-xl text-destructive mb-2">Danger zone</h2>
        <p className="text-sm text-muted-foreground mb-3">Delete your account and all your scans, spots, and profile data. This cannot be undone.</p>
        {!deleteOpen ? (
          <button onClick={() => setDeleteOpen(true)} className="btn-ghost text-destructive">Delete my account</button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">Type <strong>DELETE ME</strong> to confirm.</p>
            <input className="input-field" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} aria-label='Type "DELETE ME"' />
            <div className="flex gap-2">
              <button onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }} className="btn-ghost">Cancel</button>
              <button onClick={deleteAccount} disabled={deleteConfirm !== "DELETE ME"} className="btn-primary !bg-destructive hover:!bg-destructive/90">Permanently delete</button>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
};

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer">
    <span className="text-sm">{label}</span>
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition ${checked ? "bg-primary" : "bg-border"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  </label>
);

export default Settings;

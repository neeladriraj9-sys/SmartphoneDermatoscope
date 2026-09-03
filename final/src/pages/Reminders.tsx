import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, isAfter } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";
import { findBodyLocation } from "@/lib/bodyLocations";

const FREQS = [
  { value: 0, label: "Off" },
  { value: 30, label: "Every 30 days" },
  { value: 60, label: "Every 60 days" },
  { value: 90, label: "Every 90 days" },
  { value: 180, label: "Every 6 months" },
];

const Reminders = () => {
  const { user } = useAuth();
  const [spots, setSpots] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("spots").select("*").eq("user_id", user.id).eq("is_archived", false).order("next_reminder_date", { ascending: true });
    setSpots(data || []);
  };

  useEffect(() => { load(); }, [user]);

  const update = async (id: string, days: number) => {
    const next = days === 0 ? null : new Date(Date.now() + days * 86400000).toISOString();
    const { error } = await supabase.from("spots").update({ reminder_frequency_days: days, next_reminder_date: next }).eq("id", id);
    if (error) return toast.error("Could not update reminder.");
    toast.success("Reminder updated.");
    load();
  };

  const now = new Date();

  return (
    <AppLayout>
      <Seo title="My Reminders" noindex />
      <header className="mb-6">
        <h1 className="font-display text-3xl">Reminders</h1>
        <p className="text-muted-foreground mt-1">Set how often you'd like a nudge to re-check each spot.</p>
      </header>

      {spots.length === 0 ? (
        <div className="card-soft text-center py-12">
          <p className="text-sm text-muted-foreground mb-4">No tracked spots yet.</p>
          <Link to="/new-scan" className="btn-primary">Track your first spot</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {spots.map((s) => {
            const loc = findBodyLocation(s.body_location);
            const overdue = s.next_reminder_date && isAfter(now, new Date(s.next_reminder_date));
            return (
              <div key={s.id} className={`card-soft ${overdue ? "bg-risk-watch-bg" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <h3 className="font-display text-lg">{s.nickname}</h3>
                    <p className="text-xs text-muted-foreground">
                      {loc?.label || s.body_location_label}
                      {s.next_reminder_date && ` · Next: ${format(new Date(s.next_reminder_date), "d MMM yyyy")}`}
                      {overdue && " · Overdue"}
                    </p>
                  </div>
                  <select
                    aria-label="Reminder frequency"
                    value={s.reminder_frequency_days}
                    onChange={(e) => update(s.id, Number(e.target.value))}
                    className="input-field !py-2 !w-auto"
                  >
                    {FREQS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <Link to={`/new-scan?spot=${s.id}`} className="btn-primary !py-2 !px-4 text-sm">Re-scan now</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Reminders;

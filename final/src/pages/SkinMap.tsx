import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";
import { BodyMap } from "@/components/BodyMap";
import { RiskBadge, type RiskLevel } from "@/components/RiskBadge";
import { findBodyLocation } from "@/lib/bodyLocations";

const SkinMap = () => {
  const { user } = useAuth();
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("spots").select("*").eq("user_id", user.id).eq("is_archived", false)
      .order("latest_risk_level", { ascending: true })
      .then(({ data }) => { setSpots(data || []); setLoading(false); });
  }, [user]);

  return (
    <AppLayout>
      <Seo title="My Skin Map" noindex />
      <header className="mb-6">
        <h1 className="font-display text-3xl">My Skin Map</h1>
        <p className="text-muted-foreground mt-1">All the spots you're tracking, visualised on your body.</p>
      </header>

      <div className="card-soft mb-6">
        <BodyMap spots={spots as any} size="lg" />
      </div>

      {loading ? (
        <p className="pulse-soft text-center text-muted-foreground py-8 text-sm">Loading…</p>
      ) : spots.length === 0 ? (
        <div className="card-soft text-center py-12">
          <p className="text-sm text-muted-foreground mb-4">You haven't tracked any spots yet.</p>
          <Link to="/new-scan" className="btn-primary">Scan your first spot</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {spots.map((s) => {
            const loc = findBodyLocation(s.body_location);
            return (
              <div key={s.id} className="card-soft flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg truncate">{s.nickname}</h3>
                    {s.latest_risk_level && <RiskBadge level={s.latest_risk_level as RiskLevel} size="sm" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loc?.label || s.body_location_label} · Next check: {s.next_reminder_date ? format(new Date(s.next_reminder_date), "d MMM yyyy") : "—"}
                  </p>
                </div>
                <Link to={`/new-scan?spot=${s.id}`} className="btn-ghost text-sm !py-2 !px-4">Re-scan</Link>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default SkinMap;

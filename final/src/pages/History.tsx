import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";
import { ScanCard } from "@/components/ScanCard";
import type { RiskLevel } from "@/components/RiskBadge";

const FILTERS: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reassuring", label: "Reassuring" },
  { value: "watch", label: "Worth Monitoring" },
  { value: "see_doctor_soon", label: "See Doctor Soon" },
  { value: "see_doctor_urgently", label: "Urgent" },
];

const History = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [spots, setSpots] = useState<Record<string, any>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<RiskLevel | "all">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: scansData }, { data: spotsData }] = await Promise.all([
        supabase.from("scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("spots").select("*").eq("user_id", user.id),
      ]);
      setScans(scansData || []);
      setSpots(Object.fromEntries((spotsData || []).map((s) => [s.id, s])));
      if (scansData?.length) {
        const urls: Record<string, string> = {};
        await Promise.all(scansData.map(async (s) => {
          const { data } = await supabase.storage.from("scans").createSignedUrl(s.image_path, 3600);
          if (data?.signedUrl) urls[s.id] = data.signedUrl;
        }));
        setThumbs(urls);
      }
    })();
  }, [user]);

  const filtered = scans.filter((s) => {
    if (filter !== "all" && s.risk_level !== filter) return false;
    if (q && !((spots[s.spot_id]?.nickname || "").toLowerCase().includes(q.toLowerCase()) ||
              (s.body_location || "").toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <AppLayout>
      <Seo title="Scan History" noindex />
      <header className="mb-6">
        <h1 className="font-display text-3xl">Scan history</h1>
        <p className="text-muted-foreground mt-1">Every scan you've ever done, all in one place.</p>
      </header>

      <div className="card-soft mb-6 space-y-3">
        <input
          type="search"
          placeholder="Search by nickname or body location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input-field"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-primary-light"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-soft text-center py-12">
          <p className="text-sm text-muted-foreground mb-4">
            {scans.length === 0 ? "No scans yet. Start tracking your skin health today." : "No scans match those filters."}
          </p>
          {scans.length === 0 && <Link to="/new-scan" className="btn-primary">Check your first spot</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <ScanCard
              key={s.id}
              id={s.id}
              body_location={s.body_location}
              risk_level={s.risk_level as RiskLevel}
              created_at={s.created_at}
              thumbnail={thumbs[s.id]}
              nickname={spots[s.spot_id]?.nickname}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default History;

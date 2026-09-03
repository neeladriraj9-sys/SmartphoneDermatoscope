import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, AlertCircle, Calendar, Activity, MapPin } from "lucide-react";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";
import { BodyMap } from "@/components/BodyMap";
import { ScanCard } from "@/components/ScanCard";
import type { RiskLevel } from "@/components/RiskBadge";

const TIPS = [
  "A monthly self-check takes 10 minutes and catches almost everything that matters.",
  "Most moles you'll ever see are harmless — knowing your skin is what makes the rest stand out.",
  "Natural daylight gives you the clearest view of any spot.",
  "Don't forget less obvious places: scalp, soles of feet, between toes.",
  "Sun protection is the single best thing you can do for your skin.",
  "A new spot that doesn't match your others is worth a closer look.",
  "Itching, bleeding, or crusting in a spot is a reason to see a doctor.",
  "Skin checks aren't about fear — they're about knowing.",
  "Bring photos to your GP appointment — it makes the visit much more useful.",
  "Catching something early is always better than catching it late.",
];

const Home = () => {
  const { user } = useAuth();
  const [spots, setSpots] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const tip = TIPS[new Date().getDate() % TIPS.length];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: spotsData }, { data: scansData }, { data: profileData }] = await Promise.all([
        supabase.from("spots").select("*").eq("user_id", user.id).eq("is_archived", false).order("created_at", { ascending: false }),
        supabase.from("scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setSpots(spotsData || []);
      setScans(scansData || []);
      setProfile(profileData);

      // Signed URLs for thumbnails
      if (scansData && scansData.length) {
        const urls: Record<string, string> = {};
        await Promise.all(scansData.map(async (s) => {
          const { data } = await supabase.storage.from("scans").createSignedUrl(s.image_path, 3600);
          if (data?.signedUrl) urls[s.id] = data.signedUrl;
        }));
        setThumbnails(urls);
      }
    })();
  }, [user]);

  const now = new Date();
  const overdue = spots.filter((s) => s.next_reminder_date && isAfter(now, new Date(s.next_reminder_date)));
  const attention = spots.filter((s) => s.latest_risk_level && s.latest_risk_level !== "reassuring").length;
  const lastScanDate = scans[0]?.created_at;
  const daysSinceLast = lastScanDate ? Math.floor((now.getTime() - new Date(lastScanDate).getTime()) / 86400000) : null;
  const firstName = (profile?.full_name || user?.name || "there").split(" ")[0];

  return (
    <AppLayout>
      <Seo title="My Skin Dashboard" noindex description="Your SkinScan AI dashboard — quick stats, your skin map, and recent scans." />

      <section className="card-soft mb-6">
        <h1 className="font-display text-2xl">Hello {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">{format(now, "EEEE, d MMMM yyyy")}</p>
        <p className="text-sm mt-3 p-3 rounded-lg bg-primary-light text-primary-dark">💡 {tip}</p>
      </section>

      {overdue.length > 0 && (
        <div className="card-soft mb-6 bg-risk-watch-bg flex items-start gap-3">
          <AlertCircle className="text-risk-watch-fg flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-semibold text-risk-watch-fg text-sm">
              You have {overdue.length} spot{overdue.length > 1 ? "s" : ""} due for a re-check.
            </p>
            <p className="text-xs text-risk-watch-fg/80 mt-1">Don't put it off — early spotting is everything.</p>
          </div>
          <Link to="/reminders" className="btn-primary text-sm whitespace-nowrap">Re-check now</Link>
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<MapPin size={18} />} label="Spots tracked" value={spots.length.toString()} />
        <StatCard icon={<Calendar size={18} />} label="Last scan" value={lastScanDate ? formatDistanceToNow(new Date(lastScanDate), { addSuffix: true }) : "Never"} />
        <StatCard icon={<AlertCircle size={18} />} label="Need attention" value={attention.toString()} />
        <StatCard icon={<Activity size={18} />} label="Days since last check" value={daysSinceLast?.toString() ?? "—"} />
      </section>

      <section className="card-soft mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Your skin map</h2>
          <Link to="/skin-map" className="text-sm text-primary-dark hover:underline">View full map →</Link>
        </div>
        <BodyMap spots={spots as any} size="sm" />
      </section>

      <Link to="/new-scan" className="card-soft card-soft-hover mb-6 flex items-center gap-4 bg-gradient-to-r from-primary-light to-card">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
          <Camera size={22} />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl">Check a spot</h2>
          <p className="text-sm text-muted-foreground">Take a photo and get a plain-English read in seconds.</p>
        </div>
        <span className="text-primary-dark font-semibold text-sm hidden sm:inline">Start →</span>
      </Link>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Recent scans</h2>
          {scans.length > 0 && <Link to="/history" className="text-sm text-primary-dark hover:underline">View all →</Link>}
        </div>
        {scans.length === 0 ? (
          <div className="card-soft text-center py-10">
            <p className="text-sm text-muted-foreground mb-4">No scans yet. Start tracking your skin today.</p>
            <Link to="/new-scan" className="btn-primary">Check your first spot</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((s) => (
              <ScanCard key={s.id}
                id={s.id} body_location={s.body_location} risk_level={s.risk_level as RiskLevel} created_at={s.created_at}
                thumbnail={thumbnails[s.id]}
                nickname={spots.find((sp) => sp.id === s.spot_id)?.nickname}
              />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="card-soft !p-4">
    <div className="text-primary mb-1">{icon}</div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-display text-lg mt-0.5 truncate">{value}</p>
  </div>
);

export default Home;

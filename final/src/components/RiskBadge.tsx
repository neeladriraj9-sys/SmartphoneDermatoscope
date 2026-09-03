export type RiskLevel = "reassuring" | "watch" | "see_doctor_soon" | "see_doctor_urgently";

const CONFIG: Record<RiskLevel, { label: string; bg: string; fg: string; icon: string }> = {
  reassuring: { label: "Reassuring", bg: "bg-risk-reassuring-bg", fg: "text-risk-reassuring-fg", icon: "🛡️" },
  watch: { label: "Worth Monitoring", bg: "bg-risk-watch-bg", fg: "text-risk-watch-fg", icon: "👁️" },
  see_doctor_soon: { label: "See a Doctor Soon", bg: "bg-risk-soon-bg", fg: "text-risk-soon-fg", icon: "📅" },
  see_doctor_urgently: { label: "See a Doctor Urgently", bg: "bg-risk-urgent-bg", fg: "text-risk-urgent-fg", icon: "🔔" },
};

export const RiskBadge = ({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" | "lg" }) => {
  const cfg = CONFIG[level];
  const sizing =
    size === "sm" ? "text-xs px-2.5 py-1" :
    size === "lg" ? "text-base px-4 py-2" : "text-sm px-3 py-1.5";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${cfg.bg} ${cfg.fg} ${sizing}`}>
      <span aria-hidden>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
};

export const RISK_COLOR_HEX: Record<RiskLevel, string> = {
  reassuring: "#2D9B6F",
  watch: "#D97706",
  see_doctor_soon: "#E05C1A",
  see_doctor_urgently: "#DC2626",
};

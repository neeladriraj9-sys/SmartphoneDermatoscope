import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

type Change = "improved" | "unchanged" | "changed" | "significantly_changed";

const CONFIG: Record<Change, { label: string; icon: any; bg: string; fg: string }> = {
  improved: { label: "Improved since last scan", icon: TrendingDown, bg: "bg-risk-reassuring-bg", fg: "text-risk-reassuring-fg" },
  unchanged: { label: "Unchanged since last scan", icon: Minus, bg: "bg-secondary", fg: "text-foreground" },
  changed: { label: "Changed since last scan", icon: ArrowRight, bg: "bg-risk-watch-bg", fg: "text-risk-watch-fg" },
  significantly_changed: { label: "Significantly changed since last scan", icon: TrendingUp, bg: "bg-risk-soon-bg", fg: "text-risk-soon-fg" },
};

export const ChangeIndicator = ({ change }: { change: Change }) => {
  const cfg = CONFIG[change];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.bg} ${cfg.fg}`}>
      <Icon size={14} aria-hidden />
      {cfg.label}
    </span>
  );
};

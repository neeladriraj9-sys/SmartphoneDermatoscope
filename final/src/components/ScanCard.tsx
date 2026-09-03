import { Link } from "react-router-dom";
import { RiskBadge, type RiskLevel } from "./RiskBadge";
import { findBodyLocation } from "@/lib/bodyLocations";
import { formatDistanceToNow } from "date-fns";

interface ScanCardProps {
  id: string;
  nickname?: string;
  body_location: string;
  risk_level: RiskLevel | null;
  created_at: string;
  thumbnail?: string | null;
  href?: string;
}

export const ScanCard = ({ id, nickname, body_location, risk_level, created_at, thumbnail, href }: ScanCardProps) => {
  const loc = findBodyLocation(body_location);
  const link = href || `/scans/${id}`;
  return (
    <Link to={link} className="card-soft card-soft-hover flex items-center gap-4 fade-in">
      <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={nickname || "scan"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-base truncate">{nickname || "Untitled spot"}</h3>
          {risk_level && <RiskBadge level={risk_level} size="sm" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {loc?.label || body_location} · {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
};

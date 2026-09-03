import { useState } from "react";
import { BODY_LOCATIONS, findBodyLocation, type BodySide } from "@/lib/bodyLocations";
import { RISK_COLOR_HEX, type RiskLevel } from "./RiskBadge";

interface Spot {
  id: string;
  nickname: string;
  body_location: string;
  latest_risk_level: RiskLevel | null;
}

const BodySilhouette = ({ side }: { side: BodySide }) => {
  // Minimal stylised human silhouette, viewBox 100x100 (we draw paths once for each side)
  if (side === "front") {
    return (
      <g fill="hsl(var(--primary-light))" stroke="hsl(var(--primary))" strokeWidth="0.6" strokeLinejoin="round">
        {/* head */}
        <ellipse cx="50" cy="9" rx="6" ry="7" />
        {/* neck */}
        <rect x="47" y="15" width="6" height="4" rx="1" />
        {/* torso */}
        <path d="M36 20 Q50 18 64 20 L62 45 Q50 48 38 45 Z" />
        {/* hips */}
        <path d="M38 45 Q50 47 62 45 L60 55 Q50 56 40 55 Z" />
        {/* left arm */}
        <path d="M36 21 L30 28 L26 42 L24 50" fill="none" strokeWidth="3" strokeLinecap="round" />
        {/* right arm */}
        <path d="M64 21 L70 28 L74 42 L76 50" fill="none" strokeWidth="3" strokeLinecap="round" />
        {/* left leg */}
        <path d="M44 55 L43 75 L44 95" fill="none" strokeWidth="4" strokeLinecap="round" />
        {/* right leg */}
        <path d="M56 55 L57 75 L56 95" fill="none" strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g fill="hsl(var(--primary-light))" stroke="hsl(var(--primary))" strokeWidth="0.6" strokeLinejoin="round">
      <ellipse cx="50" cy="9" rx="6" ry="7" />
      <rect x="47" y="15" width="6" height="4" rx="1" />
      <path d="M36 20 Q50 18 64 20 L62 45 Q50 48 38 45 Z" />
      <path d="M38 45 Q50 47 62 45 L60 55 Q50 56 40 55 Z" />
      <path d="M36 21 L30 28 L26 42 L24 50" fill="none" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 21 L70 28 L74 42 L76 50" fill="none" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 55 L43 75 L44 95" fill="none" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 55 L57 75 L56 95" fill="none" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
};

interface BodyMapProps {
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
  size?: "sm" | "md" | "lg";
}

export const BodyMap = ({ spots, onSpotClick, size = "md" }: BodyMapProps) => {
  const [side, setSide] = useState<BodySide>("front");
  const [hovered, setHovered] = useState<string | null>(null);

  const visible = spots
    .map((s) => ({ spot: s, loc: findBodyLocation(s.body_location) }))
    .filter((x) => x.loc && x.loc.side === side);

  const dim = size === "sm" ? "h-64" : size === "lg" ? "h-[500px]" : "h-96";

  return (
    <div className="flex flex-col items-center">
      <div className="inline-flex bg-secondary rounded-full p-1 mb-4" role="tablist">
        {(["front", "back"] as BodySide[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={side === s}
            onClick={() => setSide(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
              side === s ? "bg-card text-primary-dark shadow-sm" : "text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={`relative ${dim}`}>
        <svg viewBox="0 0 100 100" className="h-full" preserveAspectRatio="xMidYMid meet" aria-label={`Body map (${side})`}>
          <BodySilhouette side={side} />
          {visible.map(({ spot, loc }) => {
            if (!loc) return null;
            const color = spot.latest_risk_level ? RISK_COLOR_HEX[spot.latest_risk_level] : "#5C6B66";
            return (
              <g key={spot.id} transform={`translate(${loc.x}, ${loc.y})`}>
                <circle
                  r={hovered === spot.id ? 2.4 : 1.8}
                  fill={color}
                  stroke="white"
                  strokeWidth="0.4"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHovered(spot.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSpotClick?.(spot)}
                >
                  <title>{spot.nickname} — {loc.label}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>
      {visible.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2">No spots on this side yet.</p>
      )}
    </div>
  );
};

export default BodyMap;

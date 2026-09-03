import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="SkinScan AI home">
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 3C10 9 6.5 13 6.5 18.5a9.5 9.5 0 0019 0C25.5 13 22 9 16 3z"
        fill="hsl(var(--primary-light))"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="18" r="1.5" fill="hsl(var(--primary))" />
      <circle cx="19" cy="20" r="1" fill="hsl(var(--primary))" />
      <circle cx="16" cy="22.5" r="0.8" fill="hsl(var(--primary))" />
    </svg>
    <span className="font-display text-xl text-foreground">SkinScan AI</span>
  </Link>
);

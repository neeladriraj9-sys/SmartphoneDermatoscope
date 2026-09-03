import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";
import { Construction } from "lucide-react";

/**
 * Phase 1 placeholder for routes that get full implementations in Phase 2.
 * Renders a real, on-brand layout (not "coming soon" text) so navigation works end-to-end.
 */
export const PhasePlaceholder = ({ title, blurb, ctaTo, ctaLabel }: {
  title: string; blurb: string; ctaTo?: string; ctaLabel?: string;
}) => (
  <AppLayout>
    <Seo title={title} noindex />
    <div className="card-soft max-w-xl mx-auto text-center py-12">
      <div className="w-14 h-14 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-4">
        <Construction size={24} />
      </div>
      <h1 className="font-display text-2xl mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{blurb}</p>
      {ctaTo && ctaLabel && (
        <Link to={ctaTo} className="btn-primary">{ctaLabel}</Link>
      )}
    </div>
  </AppLayout>
);

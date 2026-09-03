import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";

const NotFound = () => (
  <AppLayout>
    <Seo title="Page Not Found" noindex />
    <div className="card-soft text-center py-16 max-w-md mx-auto">
      <div className="text-6xl mb-4" aria-hidden>🔍</div>
      <h1 className="font-display text-2xl mb-2">This page got lost somewhere on your skin</h1>
      <p className="text-sm text-muted-foreground mb-6">404 — we couldn't find what you were looking for.</p>
      <Link to="/" className="btn-primary">Go to dashboard</Link>
    </div>
  </AppLayout>
);

export default NotFound;

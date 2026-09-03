import { Logo } from "./Logo";
import { Link } from "react-router-dom";

export const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <header className="h-16 border-b border-border bg-card">
      <div className="container-narrow h-full flex items-center justify-between">
        <Logo />
        <div className="flex gap-2">
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
        </div>
      </div>
    </header>
    <main className="flex-1 flex items-center justify-center p-4" id="main">
      <div className="w-full max-w-md fade-in">
        <div className="card-soft">
          <h1 className="font-display text-2xl mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </main>
  </div>
);

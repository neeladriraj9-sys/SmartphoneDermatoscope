import { Navbar } from "./Navbar";

export const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 container-narrow py-8 fade-in" id="main">
      {children}
    </main>
    <footer className="border-t border-border bg-card mt-12">
      <div className="container-narrow py-6 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 justify-between">
        <p>© {new Date().getFullYear()} SkinScan AI · Awareness tool, not a medical diagnosis</p>
        <div className="flex gap-4">
          <a href="/about" className="hover:text-foreground">About</a>
          <a href="/contact" className="hover:text-foreground">Contact</a>
          <a href="/learn" className="hover:text-foreground">Learn</a>
        </div>
      </div>
    </footer>
  </div>
);

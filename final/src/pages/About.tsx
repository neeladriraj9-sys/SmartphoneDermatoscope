import { Camera, Brain, Bell, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";

const About = () => (
  <AppLayout>
    <Seo
      title="About SkinScan AI"
      description="SkinScan AI helps everyday people monitor their skin health using AI-powered image analysis. Learn how it works and what it can — and can't — do."
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "SkinScan AI",
        description: "Plain-English AI awareness tool for everyday skin health monitoring.",
        applicationCategory: "HealthApplication",
        operatingSystem: "Any",
        url: typeof window !== "undefined" ? window.location.origin : "/",
      }}
    />

    <header className="text-center mb-10">
      <h1 className="font-display text-4xl">A calmer way to keep an eye on your skin</h1>
      <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
        We believe no one should ignore a worrying spot just because they can't get a dermatologist appointment quickly.
        SkinScan AI gives you a calm, private, honest first opinion — and tells you when to get a proper one.
      </p>
    </header>

    <section className="grid sm:grid-cols-3 gap-4 mb-10">
      {[
        { icon: Camera, title: "1. Photo", text: "Take a clear close-up of any mole or skin spot you're tracking." },
        { icon: Brain, title: "2. AI Analysis", text: "We read shape, colour, and changes in plain English — no jargon." },
        { icon: Bell, title: "3. Know what to do", text: "Get one clear next step. Monitor, or see a GP — that's it." },
      ].map((s) => (
        <div key={s.title} className="card-soft text-center">
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary mx-auto flex items-center justify-center mb-3">
            <s.icon size={22} />
          </div>
          <h3 className="font-display text-lg">{s.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{s.text}</p>
        </div>
      ))}
    </section>

    <section className="card-soft mb-8">
      <h2 className="font-display text-2xl mb-3">What this tool can and can't do</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-sm text-risk-reassuring-fg mb-2">What it can</h3>
          <ul className="text-sm space-y-1.5 text-muted-foreground list-disc pl-5">
            <li>Help you notice early changes in moles and skin spots</li>
            <li>Give plain-English feedback on what features stand out</li>
            <li>Track every spot over time on a personal skin map</li>
            <li>Remind you when it's time to re-check</li>
            <li>Generate a doctor-friendly summary you can bring to a GP</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-destructive mb-2">What it can't</h3>
          <ul className="text-sm space-y-1.5 text-muted-foreground list-disc pl-5">
            <li>Replace a real examination by a doctor or dermatologist</li>
            <li>Give a medical diagnosis of any condition</li>
            <li>Detect anything below the skin or anything the camera can't see</li>
            <li>Treat or prescribe — only doctors do that</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="card-soft mb-8 bg-primary-light/40">
      <div className="flex gap-3 items-start">
        <ShieldAlert className="text-primary flex-shrink-0 mt-0.5" size={22} />
        <div>
          <h2 className="font-display text-lg">Medical disclaimer</h2>
          <p className="text-sm mt-2">
            SkinScan AI is an awareness tool. It does not provide medical diagnosis, treatment, or advice.
            If you're worried about any spot — regardless of what this scan says — please see a doctor.
          </p>
        </div>
      </div>
    </section>

    <div className="text-center">
      <Link to="/register" className="btn-primary">Get started — it's free</Link>
    </div>
  </AppLayout>
);

export default About;

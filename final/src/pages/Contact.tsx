import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email.").max(255),
  message: z.string().trim().min(1, "Please share a message.").max(2000),
});

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ name, email, message });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { name: n, email: em, message: m } = parsed.data;
    const { error: err } = await supabase.from("contact_messages").insert({ name: n, email: em, message: m });
    setLoading(false);
    if (err) { setError("Sorry, something went wrong. Please try again."); return; }
    setDone(true);
    toast.success("Message sent — we'll reply soon.");
    setName(""); setEmail(""); setMessage("");
  };

  return (
    <AppLayout>
      <Seo
        title="Contact Us"
        description="Get in touch with the SkinScan AI team. We're here to help."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SkinScan AI",
          url: typeof window !== "undefined" ? window.location.origin : "/",
          email: "support@skinscanai.com",
        }}
      />

      <header className="mb-6">
        <h1 className="font-display text-3xl">Get in touch</h1>
        <p className="text-muted-foreground mt-1">We typically reply within 1–2 business days.</p>
      </header>

      <div className="card-soft max-w-xl">
        {done ? (
          <div className="text-center py-8">
            <p className="font-display text-xl mb-2">Thanks — your message is on its way.</p>
            <p className="text-sm text-muted-foreground">We'll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">Name</label>
              <input id="name" required maxLength={100} className="input-field" value={name} onChange={(e) => setName(e.target.value)} aria-describedby={error ? "form-error" : undefined} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
              <input id="email" type="email" required maxLength={255} className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={error ? "form-error" : undefined} />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1.5">Message</label>
              <textarea id="message" required maxLength={2000} rows={5} className="input-field" value={message} onChange={(e) => setMessage(e.target.value)} aria-describedby={error ? "form-error" : undefined} />
            </div>
            {error && <p id="form-error" className="text-sm text-destructive" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default Contact;

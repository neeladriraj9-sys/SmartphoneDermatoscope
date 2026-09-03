import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/AuthLayout";
import { Seo } from "@/components/Seo";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address.").max(255),
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  mobile: z.string().trim().min(1, "Please enter your mobile number.").max(15),
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, name, mobile });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await api.register(parsed.data.email, parsed.data.name, parsed.data.mobile);
      toast.success("OTP sent to your email!");
      navigate("/verify-otp", { state: { email: parsed.data.email, name: parsed.data.name } });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Log in" subtitle="Welcome back — let's check on your skin.">
      <Seo title="Log In" description="Log in to your SkinScan AI account." />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">Full Name</label>
          <input id="name" type="text" autoComplete="name" required maxLength={100} className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
          <input id="email" type="email" autoComplete="email" required maxLength={255} className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="mobile" className="block text-sm font-medium mb-1.5">Mobile</label>
          <input id="mobile" type="tel" autoComplete="tel" required maxLength={15} className="input-field" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Sending OTP…" : "Continue"}
        </button>
        <p className="text-sm text-center">
          New here? <Link to="/register" className="text-primary-dark hover:underline font-semibold">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;

import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/AuthLayout";
import { Seo } from "@/components/Seo";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const state = location.state as { email?: string; name?: string } | null;
  if (!state?.email) return <Navigate to="/login" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOtp(state.email!, otp);
      login({ id: res.user.email, email: res.user.email, name: res.user.name });
      toast.success("Welcome!");
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Verify OTP" subtitle={`Enter the code sent to ${state.email}`}>
      <Seo title="Verify OTP" noindex />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="otp" className="block text-sm font-medium mb-1.5">6-digit OTP</label>
          <input
            id="otp" type="text" inputMode="numeric" autoComplete="one-time-code"
            maxLength={6} required className="input-field text-center text-2xl tracking-widest"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default VerifyOtp;

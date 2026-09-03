const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!API_BASE || API_BASE === "REPLACE_WITH_YOUR_API_GATEWAY_URL") {
    throw new Error("API Gateway URL not configured. Please contact your administrator.");
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned an invalid response. Please try again.');
  }
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data as T;
}

export interface RegisterResponse {
  requiresOtp: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  user: { email: string; name: string };
}

export const api = {
  register: (email: string, name: string, mobile: string) =>
    post<RegisterResponse>('/register', { email, name, mobile }),

  verifyOtp: (email: string, otp: string) =>
    post<VerifyOtpResponse>('/verify-otp', { email, otp }),
};

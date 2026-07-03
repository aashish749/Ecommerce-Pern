import axios from "axios";

const api = axios.create({
  baseURL: "https://ecommerce-pern-gizf.vercel.app",
});

// Token getter — set by <TokenProvider /> in the app
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

// Attach Clerk session token to every request
api.interceptors.request.use(async (config) => {
  try {
    if (_getToken) {
      const token = await _getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Ignore token errors
  }
  return config;
});

export default api;

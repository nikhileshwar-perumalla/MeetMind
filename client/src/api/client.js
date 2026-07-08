import axios from 'axios';

const TOKEN_KEY = 'meetmind_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the stale token so the router redirects to /login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) clearToken();
    return Promise.reject(err);
  }
);

/** Extracts a human-readable message from an API error, including field-level details. */
export function errorMessage(err) {
  const apiError = err.response?.data?.error;
  if (apiError?.message) {
    const details = (apiError.details || [])
      .map((d) => (typeof d === 'string' ? d : `${d.path}: ${d.message}`))
      .join('; ');
    return details ? `${apiError.message} — ${details}` : apiError.message;
  }
  return err.message || 'Something went wrong';
}

/**
 * Client HTTP (esempio axios). I due punti OBBLIGATORI, qualunque sia il client:
 * 1. `withCredentials: true` (fetch: `credentials: 'include'`) — senza, il
 *    cookie HttpOnly non viaggia verso un'API cross-origin;
 * 2. interceptor 401 → evento `auth-logout` — la sessione scaduta viene
 *    gestita in un punto solo, non in ogni chiamata.
 * Se il progetto ha già un client HTTP condiviso, aggiungi questi due punti lì.
 */
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            window.dispatchEvent(new Event('auth-logout'));
        }
        return Promise.reject(error);
    }
);

export default api;

/**
 * Hook di orchestrazione auth: bootstrap della sessione via /me, logout,
 * reazione all'evento globale `auth-logout` emesso dall'interceptor 401.
 */
import { useEffect, useCallback } from 'react';
import { useAuthStore } from './use-auth-store';
import api from './axios-client';

export const useAuth = () => {
    const { user, setUser, logout: clearStore, isAuthenticated, isLoading, setLoading } = useAuthStore();

    const fetchMe = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/auth/me');
            setUser(response.data);
        } catch {
            setUser(null); // 401 = nessuna sessione: stato pulito, niente errore
        } finally {
            setLoading(false);
        }
    }, [setUser, setLoading]);

    // Bootstrap: al primo mount prova a ricostruire la sessione dal cookie.
    // Skip sulla pagina di login per evitare un 401 inutile.
    useEffect(() => {
        if (!user && isLoading && window.location.pathname !== '/login') {
            fetchMe();
        }
    }, [user, isLoading, fetchMe]);

    const logout = async () => {
        try {
            await api.post('/api/auth/logout'); // rimuove il cookie HttpOnly
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            clearStore();
            window.location.href = '/login';
        }
    };

    // Sessione scaduta rilevata dall'interceptor: pulizia e ritorno al login.
    useEffect(() => {
        const handleLogout = () => {
            clearStore();
            window.location.href = '/login';
        };
        window.addEventListener('auth-logout', handleLogout);
        return () => window.removeEventListener('auth-logout', handleLogout);
    }, [clearStore]);

    return { user, logout, isAuthenticated, isLoading, fetchMe };
};

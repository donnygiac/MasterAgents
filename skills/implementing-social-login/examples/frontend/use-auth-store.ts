/**
 * Stato auth (esempio con Zustand).
 *
 * Se il progetto usa un altro state manager (Redux, Pinia, Context...):
 * replica questa STESSA forma di stato — user, isAuthenticated, isLoading —
 * nello strumento del progetto. isLoading parte a true: il guard mostra uno
 * spinner finché /me non ha risposto, evitando flash di redirect al login.
 */
import { create } from 'zustand';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    picture?: string;
}

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));

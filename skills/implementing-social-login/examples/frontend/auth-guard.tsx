/**
 * Guard delle rotte protette (esempio react-router).
 *
 * ATTENZIONE: questo è UX, non sicurezza. La protezione reale delle API è
 * `requireAuth` sul backend. Per altri router usa l'equivalente:
 * Next.js → middleware.ts + check nei layout; Vue Router → beforeEach.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './use-auth';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const { user, isAuthenticated, isLoading } = useAuth();

    // Spinner finché /me non ha risposto: evita il flash di redirect al login
    // quando in realtà la sessione è valida. Sostituisci con lo spinner del progetto;
    // classi Tailwind minime, niente stili inline (guardrail del kit).
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <span>Caricamento…</span>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        // `state.from` permette di tornare alla pagina richiesta dopo il login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;

/**
 * Pagina di login (esempio React) — brand-neutra: sostituisci logo, titolo e
 * stile con quelli del progetto ospite (se esiste un brandbook/skill di brand
 * identity, usala). La parte OBBLIGATORIA è solo la logica GSI.
 *
 * Prerequisito: script GSI caricato nell'HTML di base (vedi index-snippet.html).
 */
import React, { useEffect, useRef, useState } from 'react';
import api from './axios-client';
import { useAuth } from './use-auth';

// Tipi minimi per l'oggetto globale `google` iniettato dallo script GSI.
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
                    renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
                };
            };
        };
    }
}

const LoginPage: React.FC = () => {
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const { fetchMe } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Se lo script GSI non è ancora caricato al mount, riprova brevemente.
        let attempts = 0;
        const timer = setInterval(() => {
            if (window.google && googleButtonRef.current) {
                clearInterval(timer);
                window.google.accounts.id.initialize({
                    // Adatta il prefisso env al bundler (VITE_ / NEXT_PUBLIC_ / ...)
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                });
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: '320',
                    text: 'signin_with',
                    shape: 'rectangular',
                });
            } else if (++attempts > 20) {
                clearInterval(timer);
                setError('Impossibile caricare il login Google. Ricarica la pagina.');
            }
        }, 250);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCredentialResponse = async (response: { credential: string }) => {
        try {
            const res = await api.post('/api/auth/google', { id_token: response.credential });
            if (res.data.user) {
                // Il cookie HttpOnly è già stato settato dal backend:
                // basta rifare /me per popolare lo store e navigare.
                await fetchMe();
                window.location.href = '/';
            }
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            setError(status === 403
                ? 'Il tuo account non è autorizzato ad accedere.'
                : 'Accesso fallito. Riprova.');
        }
    };

    return (
        // Layout volutamente scheletrico: classi Tailwind minime, MAI stili inline.
        // Colori, logo e copy vengono da `maintaining-brand-identity` (design-tokens,
        // voice-tone); se il progetto non usa Tailwind, sposta il layout nel CSS del progetto.
        <div className="min-h-screen flex flex-col items-center justify-center gap-8">
            {/* [BRAND] logo e titolo del progetto qui */}
            <h1>Accedi</h1>
            <div ref={googleButtonRef} />
            {error && <p role="alert">{error}</p>}
        </div>
    );
};

export default LoginPage;

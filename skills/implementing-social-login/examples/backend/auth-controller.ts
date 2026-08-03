/**
 * Controller auth (esempio Express). Tre endpoint: login Google, profilo, logout.
 *
 * Il cookie è HttpOnly: il frontend non legge mai il token, si limita a
 * chiamare /me per popolare il proprio stato.
 */
import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from './auth-service';
import { UnauthorizedError } from './errors';

// Adatta alla topologia rilevata in fase di analisi (vedi resources/project-analysis.md):
// same-origin → sameSite 'strict' (o 'lax'); cross-origin → 'none' + secure obbligatori.
const COOKIE_NAME = 'app_token'; // cambia se collide con cookie già usati dal progetto
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // allineato al TTL del JWT
};

export function createAuthController(authService: AuthService) {
    return {
        async googleAuth(req: Request, res: Response, next: NextFunction) {
            try {
                const { id_token } = req.body ?? {};
                // Se il progetto ha una libreria di validazione (zod, joi...), usala qui.
                if (typeof id_token !== 'string' || id_token.length === 0) {
                    return res.status(400).json({ error: 'id_token mancante' });
                }

                const { token, user } = await authService.loginWithGoogle(id_token);
                res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
                // Il token è anche nel body per client non-browser (fallback Bearer);
                // ometti questa proprietà se servi solo browser.
                return res.status(200).json({ token, user });
            } catch (error) {
                next(error);
            }
        },

        async getMe(req: Request, res: Response, next: NextFunction) {
            try {
                // req.user è popolato dal middleware authenticateToken
                const user = (req as Request & { user?: unknown }).user;
                if (!user) throw new UnauthorizedError('Non autenticato');
                // Se c'è persistenza, qui puoi rileggere l'utente dallo store per
                // riflettere cambi di ruolo avvenuti dopo l'emissione del token.
                return res.status(200).json(user);
            } catch (error) {
                next(error);
            }
        },

        logout(_req: Request, res: Response) {
            res.clearCookie(COOKIE_NAME);
            return res.status(200).json({ message: 'Logout effettuato' });
        },
    };
}

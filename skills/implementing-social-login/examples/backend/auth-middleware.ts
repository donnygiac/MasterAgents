/**
 * Middleware di autenticazione/autorizzazione (esempio Express).
 *
 * Tre livelli:
 * 1. authenticateToken — GLOBALE e "soft": popola req.user se il token è valido,
 *    lascia passare le richieste anonime (le rotte pubbliche devono funzionare),
 *    risponde 401 se un token c'è ma è scaduto/corrotto (il client deve ripulire).
 * 2. requireAuth — la protezione VERA delle rotte API: senza req.user → 401.
 *    Il guard frontend è solo UX: ogni rotta protetta DEVE avere questo.
 * 3. requireRole — autorizzazione per ruolo, si appoggia a requireAuth.
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AuthService, AppJwtPayload } from './auth-service';
import { UnauthorizedError, ForbiddenError } from './errors';

// Estensione tipata di req.user (se il progetto ha già un declaration merging
// per Express.Request, riusa quello).
export type AuthenticatedRequest = Request & { user?: AppJwtPayload };

export function createAuthMiddleware(authService: AuthService) {
    const authenticateToken: RequestHandler = (req, _res, next) => {
        const authHeader = req.headers['authorization'];
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.app_token;
        const token = headerToken || cookieToken;

        if (!token) return next(); // anonimo: decideranno requireAuth/le rotte

        const payload = authService.verifyAppToken(token);
        if (payload) {
            (req as AuthenticatedRequest).user = payload;
            return next();
        }
        // Token presente ma invalido/scaduto: errore esplicito, così
        // l'interceptor frontend pulisce lo stato e riporta al login.
        return next(new UnauthorizedError('Sessione scaduta o non valida. Effettua nuovamente il login.'));
    };

    const requireAuth: RequestHandler = (req, _res, next) => {
        if (!(req as AuthenticatedRequest).user) {
            return next(new UnauthorizedError('Autenticazione richiesta'));
        }
        next();
    };

    const requireRole = (...roles: string[]): RequestHandler => {
        return (req: Request, _res: Response, next: NextFunction) => {
            const user = (req as AuthenticatedRequest).user;
            if (!user) return next(new UnauthorizedError('Autenticazione richiesta'));
            if (!roles.includes(user.role)) {
                return next(new ForbiddenError(`Accesso negato. Ruolo richiesto: ${roles.join(' o ')}.`));
            }
            next();
        };
    };

    return { authenticateToken, requireAuth, requireRole };
}

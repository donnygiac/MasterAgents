/**
 * Wiring del server (esempio Express) — SOLO le parti che riguardano l'auth.
 * Integra questi pezzi nell'entry point esistente del progetto, nell'ordine
 * mostrato; non creare un secondo server.
 *
 * Per altri framework mappa gli stessi concetti (vedi resources/project-analysis.md):
 * cookie parsing, CORS con credentials, hook globale soft, header COOP,
 * protezione per-router con requireAuth/requireRole.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes, { authService } from './auth-routes';
import { createAuthMiddleware } from './auth-middleware';
import { errorHandler } from './errors';

const app = express();
const { authenticateToken, requireAuth, requireRole } = createAuthMiddleware(authService);

// 1. Header COOP: senza, il popup di Google Identity Services non riesce a
//    comunicare il credential alla pagina. Basta sulla pagina che ospita il
//    bottone; metterlo globale è la scelta più semplice.
app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

// 2. CORS: necessario solo se frontend e API sono su origin diverse.
//    `credentials: true` + origin ESPLICITA (mai '*' con i cookie).
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// 3. Cookie e body parsing PRIMA del middleware auth.
app.use(cookieParser());
app.use(express.json());

// 4. Hook globale soft: popola req.user ovunque, non blocca gli anonimi.
app.use(authenticateToken);

// 5. Rotte auth (pubbliche: /google è il login).
app.use('/api/auth', authRoutes);

// 6. Rotte protette: la difesa server-side è QUESTA, non il guard frontend.
// app.use('/api/items', requireAuth, itemRoutes);
// app.use('/api/admin', requireAuth, requireRole('ADMIN'), adminRoutes);

// 7. Error handler per ultimo: traduce UnauthorizedError/ForbiddenError in 401/403.
app.use(errorHandler);

app.listen(process.env.PORT || 3000);

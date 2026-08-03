/**
 * Adapter UserStore per progetti SENZA database.
 *
 * L'identità vive interamente nel JWT applicativo: nessuna scrittura, nessuna
 * tabella. I ruoli si risolvono da variabili d'ambiente.
 *
 * Trade-off da comunicare all'utente prima di sceglierlo:
 * - nessun dato utente oltre ai claims del token (niente profili, preferenze...);
 * - nessuna revoca per-utente: una sessione emessa vale fino alla scadenza
 *   (mitigazione: TTL breve, rotazione di JWT_SECRET invalida TUTTE le sessioni);
 * - nessun elenco utenti: "chi si è mai loggato" non è ricostruibile;
 * - i ruoli sono statici (env): promuovere un admin richiede un deploy/redeploy.
 * Se il progetto ha bisogno di ruoli dinamici o dati per-utente, proponi invece
 * uno storage leggero (es. SQLite) — vedi resources/project-analysis.md.
 */
import type { UserStore, AuthUser } from './auth-service';

// Es. ADMIN_EMAILS="alice@example.com,bob@example.com"
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

function buildUser(email: string, name?: string, googleId?: string): AuthUser {
    return {
        id: email, // senza DB l'email È l'identificatore stabile
        email,
        name: name || email.split('@')[0] || 'User',
        role: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'ADMIN' : (process.env.DEFAULT_USER_ROLE || 'USER'),
        googleId: googleId ?? null,
    };
}

export const statelessUserStore: UserStore = {
    // Ritorna sempre l'utente "fabbricato": per il servizio è indistinguibile
    // da un find riuscito, e non scatta mai il ramo create.
    async findByEmail(email) {
        return buildUser(email);
    },

    async create(data) {
        return buildUser(data.email, data.name, data.googleId);
    },

    async linkGoogleId(email, googleId) {
        return buildUser(email, undefined, googleId);
    },
};

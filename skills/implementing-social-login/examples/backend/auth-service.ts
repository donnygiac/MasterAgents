/**
 * Servizio di autenticazione Google — INDIPENDENTE dalla persistenza.
 *
 * Tutto ciò che tocca il "dove vivono gli utenti" passa dalla porta UserStore:
 * per portare questo servizio su un altro stack si riscrive solo l'adapter
 * (vedi user-store.prisma.ts e user-store.stateless.ts).
 *
 * Dipendenze: google-auth-library, jsonwebtoken.
 */
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errors';

// ----- Porta di persistenza -----
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    googleId?: string | null;
}

export interface UserStore {
    findByEmail(email: string): Promise<AuthUser | null>;
    create(data: { email: string; name: string; googleId: string; role: string }): Promise<AuthUser>;
    linkGoogleId(email: string, googleId: string): Promise<AuthUser>;
}

// ----- Claims del JWT applicativo -----
export interface AppJwtPayload {
    id: string;
    email: string;
    role: string;
    name: string;
    iat?: number;
    exp?: number;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '24h';
// Vuota/assente = ogni dominio email ammesso. Il check va fatto QUI, server-side:
// il parametro `hd` lato client è solo cosmetico e aggirabile.
const ALLOWED_ORG_DOMAIN = process.env.ALLOWED_ORG_DOMAIN;
const DEFAULT_ROLE = process.env.DEFAULT_USER_ROLE || 'USER';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export function createAuthService(userStore: UserStore) {
    if (!GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID mancante');
    if (!JWT_SECRET) throw new Error('JWT_SECRET mancante'); // mai un default hardcoded

    return {
        /**
         * Verifica l'ID token Google, risolve l'utente (find-or-create) e
         * firma il JWT applicativo della sessione.
         */
        async loginWithGoogle(idToken: string): Promise<{ token: string; user: AuthUser & { picture?: string } }> {
            let payload;
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken,
                    audience: GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
            } catch {
                throw new UnauthorizedError('Token Google non valido');
            }
            if (!payload?.email || !payload.sub) {
                throw new UnauthorizedError('Token Google privo di email');
            }

            const { sub: googleId, email, name, picture } = payload;

            if (ALLOWED_ORG_DOMAIN && email.split('@')[1] !== ALLOWED_ORG_DOMAIN) {
                throw new ForbiddenError('Dominio email non autorizzato');
            }

            // Find-or-create per email: se l'utente esiste già (es. pre-censito)
            // il primo login Google aggancia il googleId al record esistente.
            let user = await userStore.findByEmail(email);
            if (user && !user.googleId) {
                user = await userStore.linkGoogleId(email, googleId);
            } else if (!user) {
                user = await userStore.create({
                    email,
                    name: name || email.split('@')[0] || 'User',
                    googleId,
                    role: DEFAULT_ROLE,
                });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, name: user.name } satisfies AppJwtPayload,
                JWT_SECRET!,
                { expiresIn: TOKEN_TTL }
            );

            return { token, user: { ...user, picture } };
        },

        /**
         * Verifica il JWT applicativo. Ritorna i claims o null (scaduto/corrotto):
         * è il chiamante (middleware) a decidere se rispondere 401.
         */
        verifyAppToken(token: string): AppJwtPayload | null {
            try {
                return jwt.verify(token, JWT_SECRET!) as AppJwtPayload;
            } catch {
                return null;
            }
        },
    };
}

export type AuthService = ReturnType<typeof createAuthService>;

# Setup Google Cloud e variabili d'ambiente

## 1. Google Cloud Console
1. Vai su [console.cloud.google.com](https://console.cloud.google.com) → seleziona/crea il progetto.
2. **APIs & Services → OAuth consent screen**: configura la schermata di consenso (tipo *Internal* se il login è ristretto alla tua organizzazione Google Workspace, altrimenti *External*). Scopes necessari: solo i base (`email`, `profile`, `openid`).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: TUTTE le origin da cui il frontend viene servito, es. `http://localhost:5173` (dev) e `https://app.tuodominio.com` (prod).
   - **Authorized redirect URIs**: non necessari per il flusso GSI a popup usato da questa skill.
4. Copia il **Client ID** (`xxxx.apps.googleusercontent.com`). Il **Client Secret NON serve** in questo flusso (la verifica dell'ID token usa solo il Client ID come audience) — non metterlo nel codice.

## 2. Variabili d'ambiente

> Regola: **mai sovrascrivere i file env esistenti**. Proponi all'utente le variabili da aggiungere; aggiorna `.env.example` se il progetto lo usa.

### Backend
| Variabile | Obbligatoria | Esempio | Note |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | sì | `1234-abc.apps.googleusercontent.com` | Stesso valore del frontend; usato come audience nella verifica |
| `JWT_SECRET` | sì | stringa random ≥ 32 byte | Genera con `openssl rand -base64 48`. Mai un default hardcoded |
| `FRONTEND_URL` | sì se cross-origin | `http://localhost:5173` | Origin ammessa nel CORS con credentials |
| `ALLOWED_ORG_DOMAIN` | no | `tuaazienda.com` | Vuota/assente = ogni dominio email ammesso |
| `NODE_ENV` | consigliata | `production` | Attiva `secure: true` sul cookie |
| `ADMIN_EMAILS` | solo modalità stateless | `a@x.com,b@x.com` | Ruoli senza database (vedi `user-store.stateless.ts`) |

### Frontend (esempio con Vite; adatta il prefisso al bundler: `NEXT_PUBLIC_`, `VUE_APP_`...)
| Variabile | Obbligatoria | Esempio | Note |
|---|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | sì | come sopra | Il Client ID è pubblico per natura: può stare nel bundle |
| `VITE_API_URL` | sì se cross-origin | `http://localhost:3000` | Base URL del backend |

## 3. Dipendenze da installare
Backend: `google-auth-library`, `jsonwebtoken` (+ `@types/jsonwebtoken`), `cookie-parser` (+ types) e `cors` se Express e non già presenti.
Frontend: **nessuna dipendenza**: GSI si carica da `<script src="https://accounts.google.com/gsi/client">` (vedi `examples/frontend/index-snippet.html`).

Non installare: Passport, Firebase — non servono a questo pattern.

## 4. Trappole note
- Bottone Google non renderizzato → script GSI non caricato o origin non presente tra le *Authorized JavaScript origins* (l'errore appare in console come 403 su `accounts.google.com`).
- Popup che si apre e non completa → manca l'header `Cross-Origin-Opener-Policy: same-origin-allow-popups` sulla pagina di login.
- Cookie non inviato alle API → manca `withCredentials`/`credentials: 'include'` sul client HTTP, o CORS senza `credentials: true`, o `sameSite` sbagliato per la topologia (cross-origin richiede `sameSite: 'none'` + HTTPS).
- `Invalid token signature/audience` → `GOOGLE_CLIENT_ID` diverso tra frontend e backend.

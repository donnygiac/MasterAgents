# Analisi preventiva del progetto ospite

Obiettivo: capire l'architettura del progetto **prima** di scrivere codice, e derivarne le decisioni di implementazione. Non assumere nulla: verifica ogni punto guardando i file reali.

## 0. Con quale strumento rilevare

Se il progetto ha CodeGraph (`.codegraph/` presente), la checklist si risolve dal grafo:
`codegraph files` (layout ed entry point), `codegraph query "auth" / "passport" / "jwt" /
"cookie"` (auth esistente), Explore agent con `codegraph_explore` (pipeline middleware/rotte).
Senza CodeGraph, procedi con glob/grep mirati sui punti della checklist.

## 1. Checklist di rilevazione

### 1.1 Layout del repository
- È un monorepo (`frontend/` + `backend/`, workspaces, turborepo)? Un fullstack framework (Next.js, Nuxt, Remix, SvelteKit)? Un solo package?
- Dove sono gli entry point? (`package.json` → `main`/`scripts.dev`, `src/server.ts`, `app/`, `pages/`...)

### 1.2 Backend
- Framework: Express? Fastify? Koa? NestJS? Hono? API routes di un fullstack framework? Nessun backend (solo static SPA)?
- Come vengono registrate le rotte e i middleware? C'è già una pipeline (error handler, logger, validazione)?
- C'è già un meccanismo di validazione input (zod, joi, yup, class-validator)? Se sì, usalo; se no, valida a mano senza aggiungere dipendenze.

### 1.3 Persistenza
- Prisma? (cerca `schema.prisma`) Altro ORM? (TypeORM, Sequelize, Drizzle, Mongoose, Knex) Query raw? **Nessun database?**
- Se c'è un DB: esiste già una tabella/collection utenti? Ha campi compatibili (email univoca)? Non duplicare: estendi.
- Se non c'è: il progetto ha bisogno di persistere utenti (ruoli per-utente, dati profilo) o basta l'identità nel token?

### 1.4 Variabili d'ambiente
- Esistono `.env`, `.env.example`, `.env.local`, config centralizzata (`config.ts`, convict, dotenv-flow)?
- **Regola**: mai sovrascrivere o riscrivere file env esistenti. Proponi all'utente la lista di variabili da AGGIUNGERE (e aggiorna `.env.example` se esiste).

### 1.5 Autenticazione esistente
- C'è già auth (passport, session, JWT, firebase, clerk, auth.js)? Se sì, **fermati e chiedi**: integrare, sostituire o affiancare?
- Ci sono già cookie applicativi? Evita collisioni di nome (default della skill: `app_token`).
- C'è già un tipo `req.user` / declaration merging su Express? Riusa i tipi esistenti.

### 1.6 Frontend
- Framework: React? Vue? Svelte? Vanilla? Server-rendered?
- Router: react-router? TanStack Router? Next.js app/pages router?
- State manager: Zustand? Redux? Pinia? Context/nessuno?
- HTTP client: axios? fetch wrapper? TanStack Query?
- Dove si carica l'HTML di base per aggiungere lo script GSI? (`index.html`, `_document`, layout root)

### 1.7 Topologia delle origin
- Frontend e API sulla **stessa origin** (proxy dev, stesso dominio in prod)? O **cross-origin** (es. `app.example.com` → `api.example.com`)?
- Questo determina la strategia cookie (vedi matrice sotto) e la config CORS.

## 2. Matrice decisionale

| Rilevazione | Decisione |
|---|---|
| Prisma presente | Adapter [`user-store.prisma.ts`](../examples/backend/user-store.prisma.ts); proponi il modello `User` minimo come DDL/schema testuale (mai `migrate` automatico) |
| Altro ORM / query raw | Scrivi un nuovo adapter che implementa l'interfaccia `UserStore` di [`auth-service.ts`](../examples/backend/auth-service.ts) con l'ORM del progetto |
| Nessun DB, non servono dati per-utente | Adapter [`user-store.stateless.ts`](../examples/backend/user-store.stateless.ts): identità nel JWT, ruoli da env. Documenta i trade-off all'utente |
| Nessun DB, ma servono ruoli/profili gestiti | Proponi all'utente l'aggiunta di uno storage leggero (es. SQLite) **prima** di procedere |
| Utenti già in DB | Estendi la tabella esistente (proposta DDL: `google_id` nullable univoco se manca); non creare una seconda tabella |
| Express | Wiring come [`server-wiring.ts`](../examples/backend/server-wiring.ts) |
| Fastify / Koa / Hono | Stessi concetti: plugin/middleware per cookie, CORS con credentials, hook globale `authenticateToken`, header COOP sulla pagina di login |
| NestJS | `AuthModule` + `AuthGuard` (Passport non necessario): il service resta quello della skill, incapsulato in un provider |
| Next.js / fullstack | Endpoint in API route/route handler; il middleware di protezione diventa `middleware.ts` + verifica nel handler; cookie via API di framework |
| Same-origin (o proxy dev) | Cookie `sameSite: 'strict'` (o `'lax'`), `secure` in produzione |
| Cross-origin | Cookie `sameSite: 'none'` + `secure: true` obbligatori; CORS con `credentials: true` e origin esplicita. In alternativa (o per client non-browser) fallback header `Authorization: Bearer` — il middleware della skill li supporta entrambi |
| React + react-router | Guard come [`auth-guard.tsx`](../examples/frontend/auth-guard.tsx) |
| Next.js frontend | Protezione via `middleware.ts` (redirect) + controllo server-side nei layout/pagine |
| Vue / Svelte | Navigation guard / hook di layout con la stessa logica: `me` → store → redirect a `/login` |
| Zustand presente | Store come [`use-auth-store.ts`](../examples/frontend/use-auth-store.ts) |
| Redux / Pinia / nessuno | Stessa forma di stato (`user`, `isAuthenticated`, `isLoading`) nello strumento del progetto; senza state manager usa un Context |
| Validazione (zod/joi/...) presente | Valida `id_token` con la libreria del progetto |
| Nessuna validazione | Controllo manuale `typeof id_token === 'string' && id_token.length > 0`; non introdurre dipendenze solo per questo |

## 3. Output della fase di analisi
Prima di implementare, presenta all'utente:
1. **Report**: stack rilevato (backend, frontend, persistenza, env, auth esistente, topologia origin).
2. **Piano adattato**: quali file creerai/modificherai e quale riga della matrice si applica.
3. **Domande aperte** (solo se non deducibili dal codice): ruolo di default dei nuovi utenti, restrizione dominio email sì/no, nome del cookie se `app_token` collide.

Procedi con l'implementazione solo dopo questo report (e le eventuali risposte).

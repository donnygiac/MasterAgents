---
name: implementing-social-login
description: Implementa una social login Google (unica social login, rotte protette, JWT applicativo in cookie HttpOnly) in un progetto Node/TypeScript qualsiasi. Usa questa skill quando devi aggiungere autenticazione Google a un progetto: prima analizza la struttura del progetto ospite (framework, persistenza, env, frontend), poi adatta l'implementazione di riferimento all'architettura trovata.
---

# Social Login Google — Skill riutilizzabile

## Panoramica
Questa skill implementa il pattern di social login Google estratto da un progetto di riferimento funzionante (React + Express + Prisma). Il pattern è **portabile**: gli esempi sono disaccoppiati dalla persistenza e dal framework, e la skill impone una **fase di analisi preventiva** del progetto ospite prima di scrivere qualsiasi riga di codice. Non dare mai per scontato che il progetto abbia Prisma, un database, o una struttura identica al riferimento.

**Rapporto con `brainstorming`**: per il login Google standard (dentro gli invarianti sotto)
questa skill incorpora già analisi e design — `brainstorming` NON serve. Se i requisiti escono
dagli invarianti (altri provider, password, SSO enterprise, sessioni server-side), fermati:
prima `brainstorming`, poi si valuta se questa skill è ancora la base giusta.

**Flusso del pattern (invariante rispetto allo stack):**
1. Il frontend carica Google Identity Services (GSI) e renderizza il bottone ufficiale Google.
2. Il callback GSI invia l'ID token Google a `POST /api/auth/google`.
3. Il backend verifica l'ID token con `google-auth-library` (audience = `GOOGLE_CLIENT_ID`).
4. Il backend risolve l'utente (find-or-create se c'è persistenza, identità stateless altrimenti).
5. Il backend firma un **JWT applicativo** (24h) e lo deposita in un **cookie HttpOnly**.
6. Le richieste successive sono autenticate dal middleware che legge cookie o header Bearer.
7. Le rotte protette hanno **doppia difesa**: guard sul router frontend + `requireAuth` sul backend.

## Invarianti (non negoziabili, qualunque sia lo stack)
- **Una sola social login**: Google. Niente password, niente altri provider.
- L'ID token Google è **sempre verificato server-side** con controllo dell'audience. Mai fidarsi del payload decodificato lato client.
- Il JWT applicativo è **disaccoppiato** dal token Google: firmato con `JWT_SECRET` proprio, scadenza propria (default 24h).
- Il token vive in un **cookie HttpOnly** (`secure` in produzione): **mai in localStorage/sessionStorage**.
- **Doppia difesa**: il guard frontend è UX, non sicurezza. Ogni rotta API protetta deve avere `requireAuth` server-side.
- Restrizione di dominio email **opzionale** via `ALLOWED_ORG_DOMAIN` (vuota/assente = tutti i domini ammessi), applicata server-side.
- Se c'è persistenza: find-or-create per email + aggancio del `googleId` a utenti preesistenti senza.
- **Mai eseguire migrazioni DB in automatico**: solo proposte DDL/schema testuali all'utente.
- **Mai sovrascrivere `.env` o file di configurazione esistenti**: proporre le variabili da aggiungere.

## Workflow

### Fase 1 — Analisi preventiva del progetto ospite (OBBLIGATORIA)
Prima di implementare, analizza il progetto in cui la skill viene usata seguendo la checklist in
👉 **[`resources/project-analysis.md`](resources/project-analysis.md)**

**Se il progetto ha CodeGraph** (`.codegraph/` presente — nei progetti nati con questo kit c'è):
la checklist si risolve dal grafo, non a mano — `codegraph files` per il layout,
`codegraph query "auth"` / `"passport"` / `"jwt"` / `"cookie"` per l'auth esistente, un Explore
agent con `codegraph_explore` per capire la pipeline middleware/rotte. Grep/glob solo come
fallback se CodeGraph non c'è.

Devi determinare: layout del repo, framework backend, presenza e tipo di persistenza (Prisma / altro ORM / nessun DB), gestione env esistente, auth già presente, framework/router/state-manager frontend, topologia delle origin (same-site o cross-site).

### Fase 2 — Report e decisioni adattive
Al termine dell'analisi, produci un breve report per l'utente con:
- cosa hai trovato (stack, persistenza, env, auth esistente);
- le decisioni che ne derivano secondo la **matrice decisionale** in `resources/project-analysis.md` (quale adapter di persistenza, dove agganciare middleware e rotte, strategia cookie, dove va il bottone di login);
- eventuali ambiguità: se una decisione non è deducibile dal codice (es. quale ruolo di default, restrizione dominio sì/no), **chiedi all'utente prima di procedere**.

### Fase 3 — Setup Google Cloud e variabili d'ambiente
Segui 👉 **[`resources/setup-google-cloud.md`](resources/setup-google-cloud.md)**
La parte su Google Cloud Console è **dell'umano** (richiede il suo account Google): fornisci le
istruzioni e attendi il `GOOGLE_CLIENT_ID`. Proponi le variabili mancanti rispettando i file env
già presenti (aggiunte, mai riscritture).

### Fase 4 — Backend
Adatta gli esempi in [`examples/backend/`](examples/backend/) all'architettura rilevata:
- [`auth-service.ts`](examples/backend/auth-service.ts) — verifica ID token, find-or-create via porta `UserStore`, firma/verifica JWT applicativo, check dominio opzionale. **Indipendente dalla persistenza.**
- [`user-store.prisma.ts`](examples/backend/user-store.prisma.ts) — adapter per progetti con Prisma (include il modello `User` minimo da proporre). Per estensioni non banali di una tabella utenti esistente, la forma la decide [`designing-mysql-tables`](../designing-mysql-tables/SKILL.md).
- [`user-store.stateless.ts`](examples/backend/user-store.stateless.ts) — adapter per progetti **senza database** (identità interamente nel JWT, ruoli da env). Leggi i trade-off documentati nel file.
- Per altri ORM (TypeORM, Sequelize, Drizzle, Mongoose, query raw): scrivi un nuovo adapter che implementa la stessa interfaccia `UserStore` — è l'unico punto di contatto con la persistenza.
- [`auth-controller.ts`](examples/backend/auth-controller.ts) + [`auth-routes.ts`](examples/backend/auth-routes.ts) — endpoint `/google`, `/me`, `/logout`, cookie HttpOnly.
- [`auth-middleware.ts`](examples/backend/auth-middleware.ts) — `authenticateToken` (soft, popola `req.user`), `requireAuth` (blocca con 401), `requireRole` (autorizzazione per ruolo).
- [`errors.ts`](examples/backend/errors.ts) — gerarchia errori minima, **solo per progetti che non hanno nulla**. Se il progetto ha già una gestione errori — e nei progetti di questo kit ce l'ha: la mappa è in [`managing-error-patterns`](../managing-error-patterns/SKILL.md) — usa le sue classi 401/403 e il suo handler, non questo file.
- [`server-wiring.ts`](examples/backend/server-wiring.ts) — wiring Express: CORS con credentials, cookie-parser, header COOP per il popup GSI. Per framework diversi da Express, mappa gli stessi concetti (vedi tabella in `resources/project-analysis.md`).

### Fase 5 — Frontend
Adatta gli esempi in [`examples/frontend/`](examples/frontend/):
- [`index-snippet.html`](examples/frontend/index-snippet.html) — script GSI.
- [`login-page.tsx`](examples/frontend/login-page.tsx) — pagina di login volutamente scheletrica: logo, colori e copy vengono da [`maintaining-brand-identity`](../maintaining-brand-identity/SKILL.md) (token + tono), mai inventati qui. Niente stili inline.
- [`axios-client.ts`](examples/frontend/axios-client.ts) — client HTTP con `withCredentials` e interceptor 401 → logout.
- [`use-auth-store.ts`](examples/frontend/use-auth-store.ts) + [`use-auth.ts`](examples/frontend/use-auth.ts) — stato auth (Zustand nel riferimento; adatta allo state manager del progetto, o Context se non ce n'è uno).
- [`auth-guard.tsx`](examples/frontend/auth-guard.tsx) + [`app-routes.tsx`](examples/frontend/app-routes.tsx) — protezione rotte con react-router; per altri router usa l'equivalente (middleware in Next.js, navigation guard in Vue Router...).

### Fase 6 — Verifica end-to-end
Checklist minima da eseguire davvero (non solo compilare):
1. `login` — bottone Google visibile, popup si apre (header COOP corretto), callback riceve il credential.
2. `POST /api/auth/google` — risponde 200, setta il cookie `app_token` HttpOnly, crea/aggancia l'utente.
3. Con dominio non ammesso (se `ALLOWED_ORG_DOMAIN` attivo) — risponde 403, nessun utente creato.
4. `GET /api/auth/me` — 200 con cookie valido, 401 senza.
5. Rotta API protetta senza token — **401 dal server** (non solo redirect frontend).
6. Rotta con ruolo insufficiente — 403.
7. `logout` — cookie rimosso, rotte protette di nuovo inaccessibili, redirect a `/login`.
8. Scadenza/token corrotto — l'interceptor 401 frontend pulisce lo stato e riporta al login.

## Architettura di dettaglio
Per il diagramma di sequenza completo, le decisioni di design e le differenze rispetto al progetto di riferimento:
👉 **[`resources/architecture.md`](resources/architecture.md)**

## Handoff

- **Input atteso**: richiesta di aggiungere login Google a un progetto (con o senza auth
  preesistente) + il `GOOGLE_CLIENT_ID` dall'umano (Fase 3).
- **Output prodotto**: auth end-to-end funzionante (backend + frontend + env proposte), report
  di analisi della Fase 2, eventuale proposta DDL per la tabella utenti, checklist Fase 6
  eseguita.
- **Prossima skill**: `maintaining-brand-identity` per rifinire la pagina di login;
  `architecture-analysis` per documentare il nuovo flusso auth (sequence diagram + tabella
  errori degli endpoint `/api/auth/*`).

## Risorse
- [`resources/project-analysis.md`](resources/project-analysis.md) — checklist di analisi + matrice decisionale
- [`resources/architecture.md`](resources/architecture.md) — flusso, sequence diagram, razionali
- [`resources/setup-google-cloud.md`](resources/setup-google-cloud.md) — setup GCP + tabella env
- [`examples/backend/`](examples/backend/) — implementazione di riferimento lato server
- [`examples/frontend/`](examples/frontend/) — implementazione di riferimento lato client

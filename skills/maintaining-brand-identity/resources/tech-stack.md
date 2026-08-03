# 🛠️ Stack Tecnologico & Standard di Ingegneria

Questo documento descrive lo **stack standard** dei progetti che usano questo kit e i vincoli
per estenderlo. La fonte di verità sulle dipendenze è **sempre** il `package.json` di ciascun
lato del progetto reale: questo file ne è la mappa commentata, non un sostituto.

## 🚫 Regola anti-allucinazione (prima di tutto)

**Non importare mai una libreria assente dal `package.json` del lato su cui lavori.** Prima di
ogni `import` nuovo, verifica che il pacchetto sia dichiarato. Aggiungere una dipendenza è una
decisione dell'utente: proponila con motivazione, non eseguire `npm install` di tua iniziativa.

Librerie che gli agenti importano sistematicamente per abitudine — verificane l'esistenza PRIMA
di usarle, nella maggior parte dei progetti di questo stack **non ci sono**:
`react-hook-form`, `recharts`, `styled-components`, `@mui/*`, `redux`, `formik`, `swr`.
Default dello stack: form come componenti controllati validati con **Zod**.

## 🌐 Frontend standard — Vite + React + TypeScript strict

- **Server state**: TanStack Query (React Query) per ogni chiamata asincrona — mai `useEffect`
  per il data fetching.
- **Global state**: Zustand, **solo** in `src/store/`. Non creare store fuori da lì e non
  duplicare in Zustand ciò che React Query già tiene in cache.
- **Styling**: Tailwind CSS + `tailwind-merge` + `clsx` (+ `class-variance-authority` per le
  varianti). Token e tema: `design-tokens.json` con la gerarchia delle fonti in `SKILL.md`.
- **Componenti base**: primitive Radix wrappate a mano in `src/components/ui/` sul pattern cva.
  Se il progetto non usa la CLI shadcn, non introdurla: imita i wrapper esistenti.
- **Routing**: react-router-dom, rotte dichiarate in `src/App.tsx`, guard in `components/auth/`.
- **Icone**: lucide-react.
- **HTTP**: axios via `src/lib/axios.ts` (unico punto con gli interceptor).

### Struttura standard (verifica quella reale con `codegraph files` dal frontend)

```text
src/
├── components/
│   ├── ui/                      # Primitive base (pattern cva + Radix)
│   ├── [feature]-elements/      # Elementi riusabili per dominio
│   ├── auth/                    # Guard (AuthGuard, RoleGuard)
│   ├── layout/                  # Wrapper di layout e sidebar
│   └── common/                  # Trasversali
├── pages/                       # Una per rotta
├── hooks/                       # use*.ts — QUI vivono gli hook React Query
├── services/                    # *Service.ts — chiamate axios pure, nessun hook
├── store/                       # Zustand (solo qui)
├── lib/                         # axios.ts, queryClient.ts, utils.ts
├── validations/                 # Schemi Zod lato client
└── utils/                       # Funzioni pure
```

**Catena obbligatoria**: `pages/ → components/ → hooks/use*.ts → services/*Service.ts →
lib/axios.ts`. Un componente non chiama mai axios direttamente; una page non chiama mai un
service direttamente.

### Strategia "Elements" (direttiva architettonica)

Ogni parte riusabile di una feature va isolata in `components/[feature]-elements/`, non inline
nella page. Le `pages/` devono limitarsi a comporre elements passando dati e callback. Prima di
creare un elemento nuovo, `codegraph query "<NomeComponente>"`: potrebbe già esistere.

## ⚙️ Backend standard — Node + Express + Prisma, ESM

- **ORM**: Prisma; individua lo schema reale (`codegraph files` o glob `**/schema.prisma`) —
  il percorso può essere dichiarato in `prisma.config.ts` e non essere quello di default.
  Client singleton in `src/lib/prisma.ts` (o equivalente del progetto).
- **Validazione**: Zod al boundary tramite middleware; il dato parsato arriva al controller su
  un campo dedicato (es. `req.validated`) — mai sovrascrivere `req.body`/`req.query`.
- **Auth**: Passport (JWT e/o OAuth), argon2 per gli hash.
- **Integrazioni esterne**: un client dedicato per servizio in `src/lib/clients/`, mai chiamate
  HTTP sparse nei service.
- **Errori**: gerarchia con classe base unica — fonte di verità in
  [`managing-error-patterns`](../../managing-error-patterns/SKILL.md).

**Catena obbligatoria**: `routes/*Routes.ts → middleware → controllers/<dominio>/ →
services/<dominio>/ → ORM | clients/`. La logica di business sta nei service; il controller
orchestra soltanto; le rotte non contengono logica.

## 🚫 Pattern Proibiti (Guardrails)

### Frontend
- **NON** usare `any`: ogni dato ha un'interfaccia o un tipo.
- **NON** usare `useEffect` per il data fetching: TanStack Query.
- **NON** iniettare stili inline (`style={{...}}`): esclusivamente classi Tailwind semantiche.
- **NON** usare `localStorage` per dati sensibili.
- **NON** duplicare stato server in Zustand: il server state vive in React Query.

### Backend
- **NON** rispondere errori con `res.status().json()`: lancia sottoclassi della classe base di
  errore del progetto.
- **NON** accedere all'ORM dai controller: solo dai service.
- **NON** mettere segreti nel codice: tutto da `process.env` (mai toccare `.env`).

### Entrambi
- **NON** importare librerie assenti dal `package.json` del lato (vedi regola in cima).
- **NON** creare nuovi pattern quando ne esiste uno nel repo: prima `codegraph query`, poi
  imita il file più simile.

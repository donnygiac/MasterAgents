# 🛠️ Hub Tecnologico & Standard di Ingegneria

Questo documento definisce i vincoli tecnici e le convenzioni obbligatorie per garantire che ogni riga di codice sia scalabile, sicura e perfettamente allineata all'identità del brand.

## 🚀 Inizializzazione Progetto (Bootstrapping)

Usa questi comandi esatti per iniziare un nuovo componente del sistema:

### Frontend (SPA)
```bash
# Crea un nuovo progetto Vite + React + TS
npx create-vite@latest ./ --template react-ts
# Installa le dipendenze base
npm install lucide-react clsx tailwind-merge zod @tanstack/react-query zustand
# Inizializza Tailwind & Shadcn
npx tailwindcss init -p
npx shadcn-ui@latest init
```

### Backend (Node.js)
```bash
# Inizializza progetto Node
npm init -y
npm install -D typescript ts-node @types/node nodemon
npx tsc --init
# Installa core backend
npm install express prisma @prisma/client passport passport-jwt argon2 zod
npx prisma init
```

---

## 🌐 Modern Frontend Stack (Vite + React)
*   **Runtime:** React 18+ con **TypeScript (Strict Mode)**.
*   **Gestione Stato:** 
    *   **Server State:** TanStack Query (React Query) v5 per ogni chiamata asincrona.
    *   **Global State:** Zustand (per logica UI globale, evita Redux).
*   **Styling:** Tailwind CSS + `tailwind-merge` + `clsx`.
*   **Componenti:** shadcn/ui (radix-ui) come fondamenta atomiche.
*   **Validazione:** **Zod** per form e risposte API.
*   **Iconografia:** Lucide React (consistenza visiva).

## ⚙️ Robust Backend Stack (Node.js + Prisma)
*   **Runtime:** Node.js (TypeScript) con architettura **Clean Architecture / Modular Monolith**.
*   **Database:** MySQL 8.0+ (InnoDB) con **Prisma ORM**.
*   **Sicurezza:** Passport.js con strategie **JWT** e hashing **Argon2id**.
*   **Validazione API:** Schemi **Zod** condivisi tra FE e BE per una "Single Source of Truth".
*   **API Pattern:** RESTful con JSON come formato di scambio.

---

## 🏗️ Architettura & Struttura File (Nomenclatura Standard)

Segui rigorosamente questa nomenclatura per garantire che ogni progetto sia organizzato, scalabile e coerente con gli standard di ingegneria del brand.

### 🗄️ Backend (Node.js + Express + Prisma)
```text
src/
├── routes/             # Definizione degli endpoint (es: authRoutes.ts, google/...)
├── controllers/        # Logica di orchestrazione (riceve req, chiama service, invia res)
│   └── [feature]/      # Gruppi logici (es: auth, google, asset)
├── services/           # Logica di business pura e chiamate DB/API esterne
│   └── [feature]/      # Gruppi logici corrispondenti ai controller
├── prisma/             # Configurazione e client Prisma
├── middleware/         # Validazione Zod, Authentication, Error handling
└── server.ts           # Entry point dell'applicazione
```

### 💻 Frontend (Vite + React + TS)
```text
src/
├── components/         # Organizzazione basata sul riutilizzo
│   ├── ui/             # Componenti base (Shadcn)
│   ├── form-elements/  # Wrapper riutilizzabili per input form (InputField, etc.)
│   ├── chart-elements/ # Wrapper riutilizzabili per grafici (ChartArea, etc.)
│   ├── forms/          # Form complessi completi (NewUserForm, etc.)
│   └── [feature]-elements/ # Altri elementi atomici specifici per feature
├── pages/              # Componenti Pagina (associati alle rotte)
├── services/           # Logica di data fetching (TanStack Query hooks)
├── hooks/              # Custom hook di utilità UI
├── data/               # Dati statici o configurazioni JSON (es: form/hardware.json)
├── lib/                # Configurazioni librerie (utils.ts, axios.ts)
├── utils/              # Funzioni di utilità pura
└── App.tsx             # Root component e routing FE
```

---

## 🏗️ Strategia di Astrazione Componenti (Element-Layer Strategy)

L'astrazione dei componenti non è opzionale, è una direttiva architettonica. **Quasi ogni componente UI deve essere astratto in un "Element" riutilizzabile** per separare la logica di presentazione dalla logica di business e ridurre il boilerplate.

### 📜 Direttiva Generale
Identifica ogni elemento atomico o molecolare che può essere riutilizzato in contesti diversi e wrappalo in una cartella dedicata sotto `components/`. Gli esempi comuni includono:

1.  **Form Elements (`/components/form-elements`)**: Wrapper che integrano `react-hook-form` e Shadcn (es: `InputField`, `SelectField`). Devono gestire autonomamente label, descrizioni e messaggi d'errore.
2.  **Chart Elements (`/components/chart-elements`)**: Astrazioni di librerie grafiche (es: Recharts) che accettano configurazioni standardizzate per colori, legende e interattività.
3.  **Feature Elements (`/components/[feature]-elements`)**: Componenti specifici per un dominio (es: `UserCard`, `ProjectBadge`) che devono essere isolati per poter essere spostati o riutilizzati facilmente tra diverse pagine o moduli.

**Obiettivo:** Il codice nelle `pages/` o nei `forms/` deve limitarsi a comporre questi "Elements" passando loro i dati e i callback necessari.

---

## 💎 Integrazione Totale dei Token
L'uso dei token definiti in `design-tokens.json` non è opzionale, è il fondamento dello stile.

1.  **Mappatura Tailwind:** I token di colore devono essere mappati nelle variabili CSS o nel file `tailwind.config.js`.
2.  **Utilizzo Dinamico:** Usa classi semantiche (`bg-primary`, `text-secondary-foreground`) invece di classi arbitrarie (`bg-[#000]`).
3.  **Spazi & Raggi:** Usa i valori `ui.border_radius_default` e `ui.spacing_base_unit` per ogni contenitore.

---

## 🚫 Pattern Proibiti (Guardrails)

### Frontend
*   **NON** usare `any`. Ogni dato deve avere un'interfaccia o un tipo.
*   **NON** usare `useEffect` per il data fetching. Usa TanStack Query.
*   **NON** iniettare stili inline (`style={{...}}`). Usa esclusivamente Tailwind.
*   **NON** usare `localStorage` per dati sensibili. Usa cookie `HttpOnly` o stato gestito.

### Backend
*   **NON** esporre i modelli Prisma direttamente nell'API. Usa i Mapper per trasformarli in DTO.
*   **NON** scrivere query SQL grezze a meno di estrema necessità prestazionale. Passa per il Prisma Query Builder.
*   **NON** gestire gli errori con semplici stringhe. Usa una classe `AppError` coerente con `managing-error-patterns`.

---

## 🛡️ Sinergia Skill & Qualità
1.  **Brainstorming**: Prima di ogni init, usa la skill `brainstorming` per validare l'architettura dei moduli.
2.  **Error Patterns**: Ogni errore UI o API deve seguire le guide in `managing-error-patterns`.
3.  **Code Style**: Usa ESLint con configurazione `standard-with-typescript` e Prettier.

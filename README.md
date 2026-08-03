# 🧰 donnygiac_skill — Kit agentico riusabile (Claude Code + CodeGraph)

Kit portabile di **7 skill Claude Code** + **CLAUDE.md template** per far lavorare l'agente in
modo deterministico su progetti con lo stack standard donnygiac: **Node/Express + Prisma + Zod**
(backend) e **React + Vite + TS + Tailwind + Zustand + React Query** (frontend).

**Filosofia — *il codice è la fonte di verità, la skill è la mappa*.** Nessuna skill contiene
valori copiati da un progetto (firme, colori, strutture): contiene le regole per ricavarli dal
progetto reale via CodeGraph e `package.json`. Per questo il kit non diventa stale e si porta
da un progetto all'altro. I punti che richiedono la realtà del progetto sono marcati
`<DA-COMPILARE: ...>` e vengono riempiti una sola volta, al bootstrap.

---

## Le 7 skill

| Skill | A cosa serve |
|---|---|
| `brainstorming` | Trasforma un'idea in un design doc validato (`docs/plans/`) prima di scrivere codice |
| `designing-mysql-tables` | Progetta schema MySQL/InnoDB in 8 step; consegna DDL come proposta, mai eseguita |
| `maintaining-brand-identity` | Unica fonte per colori, font, stack e tono di voce (popolata dal brandbook) |
| `managing-error-patterns` | Gerarchia errori tipizzata, contratto dell'error handler, retry/circuit breaker |
| `optimizing-responsive-ui` | Ripara layout esistenti rotti sui breakpoint (mai scelte di colore) |
| `architecture-analysis` | Documenta l'as-is in `docs/architecture/` con Mermaid + API reference |
| `implementing-social-login` | Aggiunge login Google end-to-end (JWT in cookie HttpOnly, rotte protette) a qualunque progetto Node/TS |

Le skill si parlano tramite sezioni **Handoff** (input → output → prossima skill) e sono
orchestrate da `CLAUDE.md`, che contiene i trigger mutuamente esclusivi e la matrice
skill × CodeGraph.

## Struttura del kit

```
donnygiac_skill/
├── README.md                      ← questo file: resta nel kit, NON va copiato nel progetto
├── CLAUDE.md                      ← template → va alla ROOT del progetto
├── settings.local.json.example    ← permessi codegraph → .claude/settings.local.json
└── skills/                        ← le 7 cartelle → .claude/skills/
```

---

## 🚀 Primo setup

Il setup è diviso per responsabilità: prima **tu** prepari il terreno (Claude non può farlo),
poi **Claude** fa tutto il resto con due prompt.

### 👤 Fase A — Cosa fa l'umano (una tantum, ~5 minuti)

1. **Copia i file nel progetto nuovo:**
   - `skills/*` (le 7 cartelle) → `<progetto>/.claude/skills/`
   - `CLAUDE.md` → root del progetto
   - `settings.local.json.example` → `<progetto>/.claude/settings.local.json`
     (se il file esiste già, fondi l'array `allow` a mano o fallo fare a Claude)
2. **Metti `brandbook.pdf` alla root** del progetto (serve al Prompt 1; senza, la parte brand
   resta in placeholder).
3. **Installa CodeGraph** se assente: `npm i -g @colbymchenry/codegraph`
   (verifica: `codegraph -V`).
4. *(Solo se userai `implementing-social-login`)* Tieni pronto l'accesso a
   [console.cloud.google.com](https://console.cloud.google.com): la creazione dell'OAuth Client ID
   è un'operazione che solo tu puoi fare col tuo account (la skill ti guida passo-passo quando
   serve, non ora).

> Perché questi passi sono tuoi: copiare file *dentro* un progetto nuovo, installare binari
> globali e accedere a console esterne con le tue credenziali sono fuori dalla portata (o dal
> mandato) dell'agente.

### 🤖 Fase B — Cosa fa Claude: Prompt 0 (bootstrap tecnico)

Apri Claude Code nel progetto e incolla:

> Questo progetto usa il kit donnygiac_skill: `CLAUDE.md` alla root è un template con segnaposto
> `<DA-COMPILARE>`. Esegui il bootstrap completo:
> 1. Individua i sottoprogetti indicizzabili (backend/frontend o root unica) ed esegui
>    `codegraph init -i` in ciascuno; verifica con `codegraph status` che il Backend sia
>    `node:sqlite — built-in`.
> 2. Compila ogni `<DA-COMPILARE>` di CLAUDE.md leggendo i `package.json` reali, i tsconfig e
>    l'output di `codegraph files` — non inventare script né percorsi.
> 3. Individua il modulo errori del progetto (`codegraph query "AppError"` o simili) e completa
>    la sezione "Fonte di verità" di `.claude/skills/managing-error-patterns/SKILL.md`; se il
>    modulo non esiste, proponi la gerarchia di riferimento della skill come nuovo file.
> 4. Compila la sezione "Contesto fisso del repo" di
>    `.claude/skills/optimizing-responsive-ui/SKILL.md` leggendo `tailwind.config` e il CSS
>    globale (breakpoint, dark mode, font, wrapper di layout).
> 5. Elimina la sezione "Setup iniziale" da CLAUDE.md e verifica che
>    `grep -rn "DA-COMPILARE" CLAUDE.md .claude/` restituisca vuoto (le uniche eccezioni ammesse:
>    i file brand, se il Prompt 1 non è ancora stato eseguito).
> 6. Riepiloga cosa hai compilato e cosa non hai potuto determinare.

### 🤖 Fase C — Cosa fa Claude: Prompt 1 (brand dal brandbook)

> Leggi `brandbook.pdf` alla root e popola le risorse di
> `.claude/skills/maintaining-brand-identity/`:
> 1. `resources/design-tokens.json`: colori (primari/secondari/neutri/semantici) con hex esatti,
>    font per titoli/corpo/logo, raggi, ombre e spaziature se dichiarati. Non inventare valori
>    assenti dal brandbook: lascia il campo con nota "non definito nel brandbook".
> 2. `resources/voice-tone.md`: persona del brand, parole chiave della personalità, regole di
>    grammatica e terminologia.
> 3. `SKILL.md`: nome del brand e gerarchia delle fonti compilata.
> 4. Se il progetto ha già `tailwind.config` con un tema, NON sovrascriverlo: confronta i token
>    col tema reale e documenta le divergenze in "Gerarchia delle fonti" della SKILL.md.

### ✅ Come sai che il setup è finito

```bash
grep -rn "DA-COMPILARE" CLAUDE.md .claude/    # → deve restituire vuoto
codegraph status                              # → "✓ Index is up to date" in ogni lato
```

Da qui in poi ogni sessione Claude Code parte già orchestrata: CodeGraph prima di tutto,
skill giuste al momento giusto, guardrail attivi.

---

## 💬 Casi d'uso — prompt pronti

### Orientarsi in un progetto (o riprenderlo dopo tempo)
> Analizza lo stato attuale del progetto: leggi CLAUDE.md, verifica `codegraph status`, e fatti
> un quadro con un Explore agent. Dammi un riepilogo di cosa è implementato prima di procedere.

### Nuova feature o modifica di comportamento → `brainstorming`
> Voglio aggiungere [descrizione]. Parti da `brainstorming`: esplora l'as-is con CodeGraph, poi
> domande una alla volta, e chiudi con il design doc in `docs/plans/` (con le sezioni "Impatto
> schema" ed "Errori previsti").

### Bugfix (nessuna skill: workflow diretto)
> C'è un bug: [comportamento errato]. Misura il baseline (test + typecheck), individua la causa
> con CodeGraph (`impact` sul simbolo sospetto), proponi il fix coerente con la gerarchia errori
> del progetto.

### Modifica allo schema DB → `designing-mysql-tables`
> Devo aggiungere [colonna/tabella] per [motivo]. Usa `designing-mysql-tables` dallo Step 0:
> leggi lo schema reale e i query path con `codegraph callers`, e consegna DDL come proposta
> testuale — non eseguire migrazioni.

### Nuovo componente UI o copy → `maintaining-brand-identity`
> Crea [componente/testo]. Usa `maintaining-brand-identity`: verifica prima con
> `codegraph query` se esiste già, poi solo token e tono dalle resources.

### Layout rotto su mobile → `optimizing-responsive-ui`
> Su [pagina] a [breakpoint/device] il layout si rompe: [sintomo]. Usa
> `optimizing-responsive-ui`: analisi con CodeGraph prima di ogni modifica, fix solo di classi,
> verifica in entrambi i temi.

### Resilienza / gestione errori → `managing-error-patterns`
> [Integrazione/flusso] fallisce male: [sintomo]. Usa `managing-error-patterns`: parti dal
> modulo errori reale, `codegraph impact` prima di toccare la gerarchia, valuta retry/circuit
> breaker per le chiamate esterne.

### Aggiungere il login Google → `implementing-social-login`
> Aggiungi il login Google a questo progetto con `implementing-social-login`. Parti dalla Fase 1
> (analisi del progetto con CodeGraph) e fermati al report della Fase 2 prima di implementare.

👤 *Nota umano*: tra la Fase 2 e l'implementazione la skill ti chiederà di creare l'OAuth
Client ID su Google Cloud Console (ha le istruzioni passo-passo) e di fornire il
`GOOGLE_CLIENT_ID`. È l'unico momento in cui serve tu.

### Documentare l'architettura → `architecture-analysis`
> Aggiorna la documentazione architetturale as-is con `architecture-analysis`: analisi
> differenziale contro l'ultima cartella in `docs/architecture/`, CodeGraph-first.

---

## 🔗 La pipeline tra le skill

Ogni SKILL.md ha una sezione **Handoff** (input → output → prossima skill). Il flusso per una
feature completa:

```
brainstorming ──docs/plans/<data>-<topic>-design.md──▶ designing-mysql-tables (se tocca lo schema)
      │                                                        │ ideas/<progetto>.md + DDL testuale
      ▼                                                        ▼
implementazione ◀── maintaining-brand-identity (token) + managing-error-patterns (errori reali)
      │
      ▼ (dopo modifiche a integrazioni/schema)
architecture-analysis ──▶ docs/architecture/<DD-MM-YYYY>/
```

`implementing-social-login` è una skill *verticale*: per il login Google standard sostituisce
`brainstorming` (incorpora analisi e design) e sfocia direttamente in
`maintaining-brand-identity` (stile pagina login) e `architecture-analysis` (documentazione del
flusso auth).

---

## 🔧 Manutenzione del kit installato

- Una regola di dominio che l'agente sbaglia → scrivila in "Vincoli di dominio" di CLAUDE.md:
  è l'unico posto letto in ogni sessione.
- Il modulo errori cambia → aggiorna la tabella in `managing-error-patterns/SKILL.md` **nello
  stesso commit**.
- Refactor estesi → `codegraph sync` nel lato toccato.
- Test di salute periodico: `grep -rn "DA-COMPILARE" CLAUDE.md .claude/` deve restare vuoto.
- Versionamento: se `.gitignore` esclude `.claude/`, aggiungi le negazioni `!/.claude/skills/`
  (e `!/docs/plans/`, `!/docs/architecture/` se usi le convenzioni del kit) — altrimenti skill
  e design doc non viaggiano col repo.

## ❓ Problemi frequenti

| Sintomo | Causa probabile |
|---|---|
| L'agente esplora con grep invece che con CodeGraph | `.codegraph/` mancante in quel lato → `codegraph init -i` |
| `codegraph status` riporta `Backend: wasm` | Binario nativo non disponibile: prestazioni ridotte, segnalato anche dall'agente |
| Prompt di permesso a ogni comando codegraph | `settings.local.json` non copiato o array `allow` non fuso |
| L'agente inventa colori o librerie | Prompt 1 non eseguito (brand in placeholder) o CLAUDE.md non bootstrappato: rifai il check `DA-COMPILARE` |
| Bottone Google non appare (social login) | Vedi "Trappole note" in `implementing-social-login/resources/setup-google-cloud.md` |

# CLAUDE.md

<!-- ============================================================================
     TEMPLATE — Kit skill donnygiac.
     I segnaposto sono marcati <DA-COMPILARE: ...>. Il bootstrap (Prompt 0 del
     README del kit) li sostituisce con la realtà del progetto e poi elimina
     la sezione "Setup iniziale". A bootstrap finito questo commento e ogni
     <DA-COMPILARE> devono essere spariti: `grep -rn "DA-COMPILARE" CLAUDE.md
     .claude/` deve restituire vuoto.
     ============================================================================ -->

## Setup iniziale (eliminare l'intera sezione a bootstrap completato)

1. Esegui `codegraph init -i` in ogni sottoprogetto indicizzabile (o alla root se il progetto è
   unico), poi compila la sezione CodeGraph sotto con i percorsi reali degli indici.
2. Metti `brandbook.pdf` alla root e lancia il Prompt 1 del README del kit per popolare
   `.claude/skills/maintaining-brand-identity/resources/`.
3. Compila ogni `<DA-COMPILARE>` di questo file leggendo i `package.json` reali e l'output di
   `codegraph files` — mai a memoria.
4. Verifica: `grep -rn "DA-COMPILARE" CLAUDE.md .claude/` → vuoto.

## CodeGraph (obbligatorio, ogni richiesta)

Questo progetto usa CodeGraph (grafo semantico locale del codice). **CodeGraph è il punto di
partenza di OGNI richiesta che tocca il codice**: prima di grep, glob, find o Read, la struttura
e le relazioni del codice si interrogano dal grafo.

**Indici del progetto** — <DA-COMPILARE: elenca i percorsi degli indici `.codegraph/`, es.
`backend/.codegraph/` e `frontend/.codegraph/`, oppure "`.codegraph/` alla root">. Ogni chiamata
MCP richiede `projectPath` assoluto alla cartella indicizzata; da CLI, esegui il comando *dentro*
quella cartella. Per domande cross-indice, interroga un indice per volta: non esiste query
cross-progetto.

**Regola di ingaggio**
1. All'inizio di ogni task, se non l'hai già fatto in questa sessione, verifica lo stato
   dell'indice con `codegraph status` nel lato pertinente. Atteso: `✓ Index is up to date` e
   `Backend: node:sqlite — built-in`. Se l'indice è disallineato esegui `codegraph sync`; se
   `Backend` riporta `wasm`, segnalalo all'utente invece di procedere.
2. Se `.codegraph/` manca in un lato, proponi `codegraph init -i` in quella cartella e non
   procedere con esplorazioni manuali estese finché non è indicizzato.

**Esplorazione ("come funziona X?", "dove sta Y?", "spiegami Z")**
NON chiamare `codegraph_explore` (né `codegraph explore`) nella sessione principale:
restituisce grandi quantità di sorgente e satura il contesto. Spawna sempre un
**Explore agent**, includendo nel prompt:

> Questo progetto ha CodeGraph inizializzato (indici: <DA-COMPILARE: percorsi>). Usa
> `codegraph_explore` passando `projectPath` assoluto al lato pertinente come strumento
> PRIMARIO: restituisce in una sola chiamata le sezioni di codice sorgente di tutti i file
> rilevanti.
> Regole:
> 1. Rispetta il budget di chiamate indicato nella descrizione del tool `codegraph_explore`.
> 2. NON rileggere file di cui codegraph_explore ha già restituito il sorgente: quelle sezioni
>    sono complete e autorevoli.
> 3. Ricorri a grep/glob/read solo per i file elencati sotto "Additional relevant files" se
>    serve più dettaglio, o se codegraph non ha restituito risultati.

**Lookup mirati consentiti nella sessione principale** (prima di modificare, non per esplorare).
L'unico tool MCP esposto è `codegraph_explore`; gli altri si usano da CLI, dentro la cartella
indicizzata:

| Scopo | Comando |
|---|---|
| Trovare simboli per nome | `codegraph query "<nome>"` |
| Tracciare il flusso delle chiamate | `codegraph callers <simbolo>` / `codegraph callees <simbolo>` |
| **Blast radius — obbligatorio prima di modificare un simbolo condiviso** | `codegraph impact <simbolo>` |
| Dettagli di un singolo simbolo | `codegraph node <simbolo>` |
| Struttura dei file indicizzati (più veloce del filesystem) | `codegraph files` |
| Stato e statistiche dell'indice | `codegraph status` |

**Prima di ogni modifica non banale**: esegui `codegraph impact` sul simbolo toccato ed elenca i
chiamanti impattati. **Dopo le modifiche**, dentro il lato pertinente:
`git diff --name-only | codegraph affected --stdin` (adatta il path relativo all'indice) per
individuare i test da eseguire.

## Progetto

<DA-COMPILARE: 2 righe su cosa fa il prodotto e per chi.>

- **Layout**: <DA-COMPILARE: monorepo/single repo, dove vivono backend e frontend, se esiste un
  package.json alla root o i comandi vanno eseguiti nelle sottocartelle.>
- **Backend** (<DA-COMPILARE: percorso>): <DA-COMPILARE: framework + ORM + validazione, es.
  "Express + Prisma (MySQL) + Zod">. Entry point <DA-COMPILARE>. Catena canonica:
  `routes/ → middleware → controllers/<dominio>/ → services/<dominio>/ → <client DB>`.
  Client di integrazioni esterne in <DA-COMPILARE o "nessuna integrazione esterna">.
- **Frontend** (<DA-COMPILARE: percorso>): <DA-COMPILARE: es. "React + Vite + TS + Tailwind +
  Zustand + React Query">. Entry point <DA-COMPILARE>, routing in <DA-COMPILARE>. Catena:
  `pages/ → components/ → hooks/use*.ts → services/*Service.ts → lib/axios.ts`. Stato globale
  solo in `src/store/`.
- Alias `@/*` → `src/*` <DA-COMPILARE: se presente, verifica nei tsconfig>.

## Comandi

Tutti da eseguire **dentro** il lato indicato. Non inventare script: verifica dai `package.json`
e aggiorna questa lista al bootstrap.

**Backend**
- <DA-COMPILARE: dev / test / typecheck / build / seed — solo script reali. Indica anche cosa
  NON esiste (es. "nessun lint configurato") per impedire verifiche annunciate e mai eseguite.>

**Frontend**
- <DA-COMPILARE: dev / build / test — e segnala se il build è anche l'unico typecheck.>

**Misura il baseline, non fidarti di elenchi di errori noti** (invecchiano a ogni commit).
Esegui test e typecheck **prima** di toccare il codice e conserva l'output: è l'unico riferimento
per distinguere una tua regressione da un rosso preesistente.

## Convenzioni

- **Validazione richieste**: Zod al boundary tramite middleware; il dato **parsato** deve
  arrivare al controller (non scartare il risultato di `parseAsync`). Mai sovrascrivere
  `req.body`/`req.query` con l'output di Zod: esponilo su un campo dedicato (es.
  `req.validated`). <DA-COMPILARE: nome del middleware reale del progetto, se esiste.>
- **Errori**: lancia sempre una sottoclasse della classe base di errore del progetto
  (<DA-COMPILARE: percorso del modulo errori, es. `src/utils/AppError.ts`>). Mai
  `res.status().json()` per un errore nei controller, mai `throw new Error`. La mappa completa
  è in `managing-error-patterns`.
- **Componenti riutilizzabili** nel frontend: `src/components/[feature]-elements/`, non in
  `components/` piatto. Le pagine compongono elements, non contengono logica di presentazione.
- **Design decisi**: scrivili in `docs/plans/YYYY-MM-DD-<topic>-design.md` prima di implementare.
- **Documentazione architetturale**: `docs/architecture/<DD-MM-YYYY>/architecture_part1.md` +
  `_part2.md` (analisi differenziale contro la cartella più recente).
- **`.claude/skills/` è l'unica fonte autorevole per Claude Code.**
- Codice, commenti e messaggi utente: <DA-COMPILARE: lingua del progetto>.

### Vincoli di dominio

<DA-COMPILARE: le regole di dominio che un agente sbaglierebbe (es. "il prezzo non è una colonna
di products ma vive in una tabella per catalogo"). Se non ce ne sono ancora, scrivi "nessuno
documentato finora" e aggiungile appena una review ne scopre uno.>

## Skill — quando usarle

Se una skill copre il task, **invocarla è obbligatorio, non facoltativo**. Leggi la sua `SKILL.md`
**prima** di iniziare il lavoro, mai a metà. Usa i nomi esatti della tabella.

| Skill | Trigger | Regole d'uso | Non usare quando |
|---|---|---|---|
| `brainstorming` | Il task introduce o cambia un **comportamento**: nuova feature, nuovo componente, nuovo flusso, modifica di semantica esistente | Prima skill in assoluto, prima di scrivere codice. Output obbligatorio: `docs/plans/YYYY-MM-DD-<topic>-design.md`. Domande una alla volta, design a sezioni di 200-300 parole | Bugfix a comportamento invariato; refactor senza cambio di semantica; sola aggiunta di test; sola modifica di DDL |
| `designing-mysql-tables` | Il task tocca lo **schema**: nuove tabelle/colonne/indici/vincoli, denormalizzazioni, problemi di performance query | Se serve anche una decisione di prodotto, `brainstorming` viene **prima** e questa dopo, per la forma delle tabelle. Output: DDL come **proposta testuale**, mai eseguita; progressi in `.claude/skills/designing-mysql-tables/ideas/<progetto>.md` | Solo lettura/query su schema esistente; modifiche applicative che non alterano lo schema |
| `maintaining-brand-identity` | Stai **creando o stilando** UI, scegliendo colori/font/spaziature, scrivendo copy o messaggi d'errore utente, o valutando una libreria | Unica fonte per token e tono: `resources/design-tokens.json`, `resources/tech-stack.md`, `resources/voice-tone.md`. Nessun valore inventato | Il layout esistente è già a norma di brand e il problema è solo il comportamento ai breakpoint → `optimizing-responsive-ui` |
| `optimizing-responsive-ui` | Un layout **esistente** si rompe: scroll orizzontale su mobile, card che non impilano, overlap, breakpoint sbagliati | Fase 1 di analisi obbligatoria prima di ogni modifica. Non scegliere colori né token: per quelli deferisci a `maintaining-brand-identity` | Stai creando un componente da zero → `maintaining-brand-identity` |
| `managing-error-patterns` | Il task riguarda **come si gestiscono i fallimenti**: gerarchia errori, codici HTTP↔applicativi, retry, circuit breaker, errori async, resilienza di un'integrazione | Fonte di verità per i codici errore. La gerarchia dichiarata deve combaciare con il modulo errori reale del progetto | Il task è una feature nuova che *include* error handling → `brainstorming` prima, questa in implementazione |
| `architecture-analysis` | Serve documentare l'**as-is**: mappare l'architettura, aggiornare `architecture_part1/2.md` dopo un cambio a integrazioni o schema | Solo documentazione di ciò che esiste. Analisi differenziale contro l'ultima cartella in `docs/architecture/` | Stai progettando qualcosa che non esiste ancora → `brainstorming` |
| `implementing-social-login` | Aggiungere **login Google** al progetto (auth, rotte protette, JWT in cookie HttpOnly) | Skill verticale completa: incorpora analisi e design, quindi **vince su `brainstorming`** per il login Google standard. Fase 1 di analisi obbligatoria; setup Google Cloud a carico dell'umano | Servono altri provider, password o SSO enterprise → prima `brainstorming` |

Nessuna skill copre: bugfix, refactor a comportamento invariato, aggiunta di test. Per questi vai
diretto al workflow.

Ogni SKILL.md ha una sezione **Handoff** (input atteso → output prodotto → prossima skill): è
vincolante, non descrittiva. La pipeline: `brainstorming` → design doc → `designing-mysql-tables`
(se il design dichiara impatto schema) → implementazione con `maintaining-brand-identity` +
`managing-error-patterns` → `architecture-analysis` a valle di modifiche a integrazioni/schema.

### Combo skill × CodeGraph (obbligatoria quando la skill è attiva)

| Skill attiva | CodeGraph richiesto |
|---|---|
| `brainstorming` | Explore agent con `codegraph_explore` per lo stato as-is, prima delle domande |
| `designing-mysql-tables` | Step 0: `codegraph callers` sui service che toccano le tabelle + lettura dello schema |
| `maintaining-brand-identity` | `codegraph query "<Componente>"` prima di creare: potrebbe già esistere |
| `optimizing-responsive-ui` | `codegraph query`/`callers` per trovare componente e chi lo monta; `impact` sui condivisi |
| `managing-error-patterns` | `codegraph impact <ClasseErroreBase>` / `callers <errorHandler>` prima di toccare la gerarchia |
| `architecture-analysis` | `codegraph files` + Explore agent per lato; ERD dallo schema DB |
| `implementing-social-login` | Fase 1: `codegraph files` + `query "auth"/"jwt"/"cookie"` per l'auth esistente |

## Workflow

0. **Baseline** — test e typecheck nel lato che toccherai, prima di ogni modifica.
1. **Stato indice** — `codegraph status` nel lato pertinente, se non già fatto in sessione.
2. **Esplorazione** — Explore agent con `codegraph_explore` (mai nella sessione principale).
3. **Selezione skill** — applica la tabella sopra; se una skill vince, leggi la sua `SKILL.md` ora.
4. **Blast radius** — `codegraph impact <simbolo>` su ogni simbolo condiviso che intendi toccare,
   ed elenca i chiamanti impattati prima di modificare.
5. **Piano** — per feature e refactor multi-file, design in `docs/plans/` prima del codice.
6. **Implementazione** — un lato per volta; rispetta le catene route→controller→service e
   page→hook→service.
7. **Test** — `codegraph affected` per individuare i test toccati, poi la suite del lato.
   Confronta col baseline del punto 0 prima di attribuirti una regressione.
8. **Verifica** — typecheck/build del lato toccato. Non annunciare verifiche (lint, test) che il
   progetto non ha.
9. **Sync indice** — dopo modifiche estese, `codegraph sync` nel lato toccato.

## Vietato

- Eseguire migrazioni o comandi DB distruttivi in automatico: le modifiche di schema si
  consegnano come DDL testuale; seed/reset solo su richiesta esplicita.
- Modificare `.env` o qualunque file di configurazione con segreti.
- Committare sul branch principale senza conferma.
- Eseguire `codegraph uninit` o `codegraph index --force` senza conferma esplicita.
- Inventare token di stile, colori o codici errore: solo quelli in
  `.claude/skills/maintaining-brand-identity/resources/` e nel modulo errori del progetto.
- **Importare librerie assenti dal `package.json` del lato** o aggiungere dipendenze senza
  conferma esplicita.
- Nel frontend: `any`, `useEffect` per data fetching (solo React Query), stili inline
  (`style={{...}}`), hex arbitrari (`bg-[#...]`) al posto delle classi semantiche.
- Nel backend: accedere all'ORM dai controller (solo dai service); sovrascrivere
  `req.body`/`req.query` con l'output di Zod.

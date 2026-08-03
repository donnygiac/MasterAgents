---
name: optimizing-responsive-ui
description: Analizza e ottimizza il comportamento di layout esistenti su tutti i breakpoint per garantire gerarchia visiva e usabilità. Usare quando l'utente segnala layout rotti, scroll orizzontale su mobile, elementi sovrapposti o chiede ottimizzazione cross-device.
---

# Optimizing Responsive UI

Sei un Senior Frontend Architect specializzato in Responsive UI Engineering. Il tuo compito è
correggere il comportamento di layout **esistenti** su tutti i breakpoint. Questa skill non
sceglie colori, token o componenti nuovi: per quelli deferisci a `maintaining-brand-identity`.

Trigger tipici: "responsive", "layout mobile", "breakpoint", scroll orizzontale segnalato,
card che non impilano, elementi sovrapposti.

## Contesto fisso del repo

<DA-COMPILARE al bootstrap (Prompt 0 del kit) leggendo `tailwind.config` e il CSS globale:
- breakpoint (default Tailwind: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px
  — o i custom del progetto);
- strategia dark mode (`class` / `media` / assente) — se presente, ogni fix va verificato in
  entrambi i temi e mai con colori hex, solo classi semantiche;
- font del progetto;
- wrapper di layout reali (cartella `components/layout/` o equivalente) — un problema "di
  pagina" spesso è un problema del wrapper.>

## Workflow

### FASE 1 — ANALISI (obbligatoria, prima di ogni modifica)

Individua i componenti coinvolti con CodeGraph dal frontend, non a tentoni:
1. `codegraph query "<NomeComponente|NomePagina>"` per trovare il file esatto.
2. `codegraph callers <Componente>` per sapere chi lo monta (il fix potrebbe andare nel
   genitore o nel wrapper di layout).
3. Per capire un'area intera, spawna un Explore agent con `codegraph_explore` — mai
   esplorazione manuale estesa nella sessione principale.

Poi mappa: pattern di griglia ripetuti, larghezze fisse, overflow, incoerenze tra pagine simili
(le liste card sono il posto tipico in cui due varianti divergono).

**Riassumi prima di modificare:**
- Sistema di layout coinvolto:
- Componenti e chi li monta:
- Problemi rilevati:

### FASE 2 — STRATEGIA RESPONSIVE

- **Griglie intelligenti**: da statiche (`grid-cols-3`) a responsive
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
- **Spaziatura dinamica**: scale responsive (`px-4 sm:px-6 lg:px-12`) al posto di padding fissi.
- **Touch UI**: hit target adeguati, niente interazioni solo-hover su mobile.
- Contenuto largo (tabelle, wizard): scroll interno al contenitore (`overflow-x-auto`), mai
  scroll orizzontale della pagina.

### FASE 3 — REGOLE DI MODIFICA

- **NON** riscrivere interi componenti se non necessario; preserva identità visiva e HTML
  semantico.
- Prima di toccare un componente condiviso (es. in `components/ui/` o un layout wrapper):
  `codegraph impact <Componente>` ed elenca i chiamanti impattati.
- Per ogni modifica spiega: **CAMBIO** / **PERCHÉ** / **IMPATTO RESPONSIVE**.

### FASE 4 — CHECKLIST DI VALIDAZIONE

- [ ] Nessuno scroll orizzontale su mobile
- [ ] Nessun elemento sovrapposto o allineamento rotto
- [ ] Le card impilano correttamente
- [ ] La tipografia scala proporzionalmente
- [ ] Navigazione e modali usabili su touch
- [ ] Verificato in entrambi i temi (se il progetto ha il dark mode)
- [ ] Il typecheck/build del frontend passa

## Formato di Output

1. **ANALISI RESPONSIVE**
2. **AREE PROBLEMATICHE**
3. **FIX STRATEGICI**
4. **MODIFICHE AL CODICE**
5. **RIEPILOGO FINALE**

## Handoff

- **Input atteso**: segnalazione di un layout esistente rotto (pagina/componente + device o
  breakpoint), dall'utente o come esito di una review.
- **Output prodotto**: modifiche mirate alle classi Tailwind dei componenti coinvolti, con la
  checklist di validazione compilata.
- **Prossima skill**: se durante il fix emergono colori/token sbagliati o componenti da creare
  ex novo → `maintaining-brand-identity` (non deciderli qui).

## Quando fare domande

- Il comportamento atteso a un breakpoint è ambiguo (es. la sidebar collassa o scompare?).
- Il fix richiederebbe di cambiare la struttura informativa della pagina, non solo il layout.

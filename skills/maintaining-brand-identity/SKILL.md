---
name: maintaining-brand-identity
description: Fornisce l'unica fonte di verità per le linee guida del brand, i design token, le scelte tecnologiche e il tono di voce. Usa questa skill ogni volta che generi componenti UI, stili per applicazioni, scrivi testi o crei asset rivolti all'utente per garantire la coerenza del brand.
---
# Identità del Brand & Linee Guida

**Nome del Brand:** <DA-COMPILARE: dal brandbook.pdf al bootstrap (Prompt 1 del kit)>

Questa skill definisce i vincoli fondamentali per il design visivo e l'implementazione tecnica del brand. Devi aderire rigorosamente a queste linee guida per mantenere la coerenza.

## Quando usare questa skill
- Generazione di nuovi componenti UI o pagine.
- Scrittura di testi di marketing, messaggi di errore o documentazione.
- Scelta di librerie o framework per il progetto.
- Applicazione di stili e temi standardizzati.

## Gerarchia delle fonti (regola d'arbitrio)

I token brand e l'implementazione nel codice possono divergere. L'ordine di autorità è:

1. **Implementazione autorevole**: il tema reale del progetto — tipicamente
   `tailwind.config.{js,ts}` + il CSS globale con le variabili (es. `src/index.css`).
   <DA-COMPILARE al bootstrap: percorsi reali, strategia dark mode (classe/media/assente),
   formato dei colori (HSL vars, hex, oklch).>
2. **Fonte brand**: `resources/design-tokens.json` (valori estratti dal brandbook.pdf).

In caso di conflitto **vince l'implementazione**: segnala la divergenza all'utente invece di
sovrascrivere in silenzio. Documenta qui le divergenze note man mano che emergono.

Conseguenze pratiche:
- Usa **solo classi semantiche** (`bg-primary`, `text-muted-foreground`), mai hex arbitrari
  (`bg-[#...]`) — l'hex romperebbe il tema.
- Se il progetto ha il tema dark, ogni componente nuovo va verificato in **entrambi i temi**.
- Se il progetto NON ha ancora un tema Tailwind, la mappatura token→`tailwind.config` è il primo
  deliverable di questa skill (proponila, non applicarla senza conferma).

## Workflow
1. **Identifica il compito**: Determina se stai progettando (UI), programmando (Codice) o scrivendo (Copy).
2. **Consulta la risorsa appropriata**:
   - Per **Colori/Font/Spazi**: Leggi `resources/design-tokens.json` (con la gerarchia sopra)
   - Per **Regole Tecniche**: Leggi `resources/tech-stack.md`
   - Per **Tono e Voce**: Leggi `resources/voice-tone.md`
3. **Verifica l'esistente con CodeGraph** (dal frontend): `codegraph query "<NomeComponente>"`
   prima di creare un componente — potrebbe già esistere in `components/ui/` o in un
   `[feature]-elements/`; se esiste, estendilo invece di duplicarlo.
4. **Applica rigorosamente**: Non inventare stili o regole. Usa solo ciò che è definito.

## Istruzioni
### Per il Design Visivo & Stile UI
Se hai bisogno di colori esatti, font, raggi dei bordi o valori di spaziatura, leggi:
👉 **[`resources/design-tokens.json`](resources/design-tokens.json)**

### Per il Coding & Implementazione Componenti
Se stai generando codice, scegliendo librerie o strutturando componenti UI, leggi i vincoli tecnici qui:
👉 **[`resources/tech-stack.md`](resources/tech-stack.md)**

### Per il Copywriting & Generazione Contenuti
Se stai scrivendo testi di marketing, messaggi di errore, documentazione o testo rivolto all'utente, leggi le linee guida della persona qui:
👉 **[`resources/voice-tone.md`](resources/voice-tone.md)**

## Handoff

- **Input atteso**: design doc di `brainstorming` (per feature nuove) oppure un task diretto di
  UI/copy/scelta libreria.
- **Output prodotto**: componenti in `components/ui/` o `components/[feature]-elements/` con
  classi semantiche, copy conforme a `voice-tone.md`.
- **Prossima skill**: messaggi d'errore utente → codici e struttura da
  [`../managing-error-patterns/SKILL.md`](../managing-error-patterns/SKILL.md); se il layout
  esistente si rompe ai breakpoint → `optimizing-responsive-ui`.

## Risorse
- [`resources/design-tokens.json`](resources/design-tokens.json)
- [`resources/tech-stack.md`](resources/tech-stack.md)
- [`resources/voice-tone.md`](resources/voice-tone.md)

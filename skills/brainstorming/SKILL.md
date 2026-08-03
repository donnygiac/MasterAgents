---
name: brainstorming
description: DEVI usare questa skill prima di qualsiasi lavoro creativo - creare funzionalità, costruire componenti, aggiungere funzionalità o modificare comportamenti. Esplora l'intento dell'utente, i requisiti e il design prima dell'implementazione.
---

# Brainstorming: Dalle Idee al Design

## Panoramica
Aiuta a trasformare le idee in design e specifiche completamente formati attraverso un dialogo collaborativo naturale.

Inizia comprendendo il contesto attuale del progetto, poi fai domande una alla volta per raffinare l'idea. Una volta che hai capito cosa stai costruendo, presenta il design in piccole sezioni (200-300 parole), controllando dopo ogni sezione se sembra corretto finora.

## Il Processo

**Comprendere il contesto (CodeGraph, non a mano):**
- Lo stato as-is si ricava dal grafo, non da scansioni manuali: spawna un **Explore agent** con
  `codegraph_explore` sul lato pertinente (indici elencati in CLAUDE.md) chiedendo com'è
  implementata oggi l'area che la feature tocca. Per feature cross-stack, un'esplorazione per lato.
- Controlla i design doc esistenti in `docs/plans/` e i commit recenti: la feature potrebbe avere
  già una storia.
- **Consulta `maintaining-brand-identity`** per assicurarti che l'idea sia in linea con lo stack
  tecnologico e i valori del brand.

**Raffinare l'idea:**
- Fai domande una alla volta
- Preferisci domande a scelta multipla quando possibile, ma anche a risposta aperta va bene

**Presentare il design:**
- Una volta che credi di aver capito cosa stai costruendo, presenta il design
- Suddividilo in sezioni di 200-300 parole
- Chiedi dopo ogni sezione se sembra corretto finora
- **Suggerisci l'astrazione di "Elements":** identifica le parti riutilizzabili e collocale in
  `components/[feature]-elements/` (convenzione del kit — vedi
  `maintaining-brand-identity/resources/tech-stack.md`). Prima di proporre un elemento nuovo,
  `codegraph query "<NomeComponente>"` dal frontend: potrebbe già esistere.
- Copri: architettura, componenti (usando i token di `maintaining-brand-identity`), flusso di
  dati, gestione degli errori (seguendo `managing-error-patterns`), test
- Sii pronto a tornare indietro e chiarire se qualcosa non ha senso

## Il documento di design

Scrivi il design validato in `docs/plans/YYYY-MM-DD-<topic>-design.md`. Due sezioni sono
**obbligatorie** perché sono l'handoff verso le skill successive:

1. **Impatto schema**: "nessuno" oppure l'elenco di tabelle/colonne toccate → in questo secondo
   caso la skill `designing-mysql-tables` va invocata subito dopo, prima di implementare.
2. **Errori previsti**: i codici applicativi coinvolti, scelti dalla gerarchia reale del modulo
   errori del progetto (la mappa è in [`managing-error-patterns`](../managing-error-patterns/SKILL.md));
   se serve un codice nuovo, il design lo dichiara qui.

Proponi il commit del documento all'utente — non committare senza conferma.

## Handoff

- **Input atteso**: un'idea o una richiesta di feature/modifica di comportamento dall'utente.
- **Output prodotto**: `docs/plans/YYYY-MM-DD-<topic>-design.md` con le due sezioni obbligatorie.
- **Prossima skill**: `designing-mysql-tables` se "Impatto schema" ≠ nessuno; poi implementazione
  con `maintaining-brand-identity` (UI/copy) e `managing-error-patterns` (errori); a valle di
  modifiche a integrazioni o schema, `architecture-analysis` per aggiornare la documentazione.

## Principi Chiave

- **Integrazione delle Skill** - Usa `maintaining-brand-identity` per lo stile, `designing-mysql-tables` per il DB e `managing-error-patterns` per la resilienza.
- **Una domanda alla volta** - Non sopraffare con domande multiple
- **Scelta multipla preferita** - Più facile da rispondere rispetto alla risposta aperta quando possibile
- **YAGNI spietato** - Rimuovi le funzionalità non necessarie da tutti i design
- **Esplora alternative** - Proponi sempre 2-3 approcci prima di decidere
- **Validazione incrementale** - Presenta il design in sezioni, valida ciascuna
- **Sii flessibile** - Torna indietro e chiarisci quando qualcosa non ha senso
- **Niente librerie fantasma** - Ogni libreria citata nel design deve esistere nel
  `package.json` del lato, o essere dichiarata esplicitamente come dipendenza nuova da approvare.

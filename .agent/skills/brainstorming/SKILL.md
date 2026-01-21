---
name: brainstorming
description: DEVI usare questa skill prima di qualsiasi lavoro creativo - creare funzionalità, costruire componenti, aggiungere funzionalità o modificare comportamenti. Esplora l'intento dell'utente, i requisiti e il design prima dell'implementazione.
---

# Brainstorming: Dalle Idee al Design

## Panoramica
Aiuta a trasformare le idee in design e specifiche completamente formati attraverso un dialogo collaborativo naturale.

Inizia comprendendo il contesto attuale del progetto, poi fai domande una alla volta per raffinare l'idea. Una volta che hai capito cosa stai costruendo, presenta il design in piccole sezioni (200-300 parole), controllando dopo ogni sezione se sembra corretto finora.

## Il Processo

**Comprendere l'idea:**
- Controlla prima lo stato attuale del progetto (file, documenti, commit recenti)
- **Consulta `maintaining-brand-identity`** per assicurarti che l'idea sia in linea con lo stack tecnologico e i valori del brand.
- Fai domande una alla volta per raffinare l'idea
- Preferisci domande a scelta multipla quando possibile, ma anche a risposta aperta va bene

...

**Presentare il design:**
- Una volta che credi di aver capito cosa stai costruendo, presenta il design
- Suddividilo in sezioni di 200-300 parole
- Chiedi dopo ogni sezione se sembra corretto finora
- **Suggerisci l'astrazione di "Elements":** Identifica parti riutilizzabili per form e grafici o per componenti UI da inserire in `/components/form-elements` o `/components/chart-elements` o in generale in `/components/[feature-name]-elements`.
- Copri: architettura, componenti (usando i token di `maintaining-brand-identity`), flusso di dati, gestione degli errori (seguendo `managing-error-patterns`), test
- Sii pronto a tornare indietro e chiarire se qualcosa non ha senso

## Dopo il Design

**Documentazione:**
- Scrivi il design validato in `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Esegui il commit del documento di design su git

**Implementazione (se si prosegue):**
- Chiedi: "Pronto per preparare l'implementazione?"
- Assicurati di seguire il piano di implementazione e i pattern di errore definiti in `managing-error-patterns`.

## Principi Chiave

- **Integrazione delle Skill** - Usa `maintaining-brand-identity` per lo stile, `designing-mysql-tables` per il DB e `managing-error-patterns` per la resilienza.
- **Una domanda alla volta** - Non sopraffare con domande multiple
- **Scelta multipla preferita** - Più facile da rispondere rispetto alla risposta aperta quando possibile
- **YAGNI spietato** - Rimuovi le funzionalità non necessarie da tutti i design
- **Esplora alternative** - Proponi sempre 2-3 approcci prima di decidere
- **Validazione incrementale** - Presenta il design in sezioni, valida ciascuna
- **Sii flessibile** - Torna indietro e chiarisci quando qualcosa non ha senso

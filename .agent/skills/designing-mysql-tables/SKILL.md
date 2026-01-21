---
name: designing-mysql-tables
description: Progetta schemi MySQL (InnoDB) robusti e scalabili seguendo un workflow procedurale in 8 step. Copre best-practices, tipi di dati, indicizzazione, vincoli e pattern di performance.
---

# 🗄️ Designing MySQL Tables (InnoDB)

Questa skill guida la progettazione di database MySQL ottimizzati per il motore InnoDB attraverso un processo rigoroso e iterativo.

## Scope & Behavior
- **Goal**: Progettare uno schema MySQL (InnoDB) robusto e scalabile.
- **Non-goals**: NON eseguire query, NON creare database reali, NON applicare migrazioni, NON manipolare dati.
- **Output**: Proposte motivate, alternative, checklist di validazione e DDL come proposta testuale (mai eseguita).

## Working Mode (Step-by-step)
Quando procedi alla progettazione, segui rigorosamente questi step. Fermati dopo ogni deliverable per validazione. Salva i progressi in `.agent/skills/designing-mysql-tables/ideas/<project-name>.md`.

### Step 0 — Context Snapshot
Raccogli informazioni su:
- Dominio applicativo e attori principali.
- Volumi stimati (righe/giorno, crescita a 12 mesi).
- Requisiti di integrità e multi-tenancy.
- Query principali (Top 10): filtri, join, ordinamenti.
**Deliverable**: Elenco "Assunzioni + Requisiti" e 10 query path descrittivi.

### Step 1 — Conceptual Model
Definisci entità e relazioni (1-N, N-N, 1-1).
- Identifica ownership e policy di cancellazione (cascade? soft delete?).
- Distingui tabelle di "stato" (entità) da tabelle di "log/eventi".
**Deliverable**: ER testuale e classificazione tabelle.

### Step 2 — Logical Model (3NF)
Assicura la Terza Forma Normale:
- Nessun attributo derivabile senza motivo.
- Risoluzione N-N con junction tables.
- Definizione chiavi naturali vs surrogate.
**Deliverable**: Schema logico (tabelle + colonne senza tipi).

### Step 3 — Physical Model (MySQL-specific)
Applica le ottimizzazioni InnoDB:
- Charset `utf8mb4` + collation moderna.
- PK: `BIGINT UNSIGNED` per auto-increment o `BINARY(16)` per UUIDv7.
- Tipi: `DECIMAL` per valuta, `DATETIME(6)` in UTC per timestamp.
- JSON: Solo per dati opzionali, con generated columns indicizzate.
**Deliverable**: Schema fisico con tipi, PK/FK, NOT NULL e DEFAULT.

### Step 4 — Index Strategy
Basata sui query path dello Step 0:
- Indici singoli vs composti (Leftmost Prefix).
- Indici per JOIN e ordinamento.
- Valutazione di Covering Indexes.
**Deliverable**: Tabella "Query → Index" e lista indici motivati.

### Step 5 — Integrity & Lifecycle
- Soft vs Hard Delete.
- Audit columns (`created_at`, `updated_at`, `created_by`).
- Strategie di concorrenza (upsert, unique constraints).
**Deliverable**: Regole di lifecycle e gestione concorrenza.

### Step 6 — Growth Plan
Valuta necessità di:
- Partizionamento per data.
- Archiviazione dati storici.
- Strategie per ridurre page split (evitare PK random).
**Deliverable**: Piano di retention e soglie di partizionamento.

### Step 7 — Final Proposal Package
Prepara il pacchetto finale:
- DDL proposto (non eseguibile).
- Diagramma testuale finale.
- Checklist di validazione finale (10-20 punti).
**Deliverable**: Schema finale e checklist di review.

## Instructions
- **Assunzioni**: Se mancano info, fai assunzioni esplicite e offri 2-3 opzioni.
- **Persistence**: Crea sempre un file in `ideas/` per tenere traccia dello storico del design.

## Resources
- Consulta [tech-stack.md](file:///Users/donnygiac/Desktop/MasterAgents/.agent/skills/maintaining-brand-identity/resources/tech-stack.md) per i vincoli di stack.
- Consulta [managing-error-patterns](file:///Users/donnygiac/Desktop/MasterAgents/.agent/skills/managing-error-patterns/SKILL.md) per resilienza DB.

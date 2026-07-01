---
name: analyzing-architecture
description: Analizza e documenta l'architettura tecnica del sistema. Da usare quando si desidera creare o aggiornare una documentazione architetturale as-is dettagliata, includendo diagrammi Mermaid (ER, flussi di sequenza), tech stack, API reference complete, flussi di firma ed e2e, pipeline di integrazione e specifiche frontend.
---

# 🏗️ Analyzing Architecture System Instructions

Questa skill guida l'agente nell'eseguire o aggiornare un'analisi tecnica profonda dell'architettura di un'applicazione (AS-IS). Produce documentazione tecnica ad altissima fedeltà strutturata esattamente come i file di riferimento storici, garantendo la massima precisione su database, endpoint API, flussi d'integrazione e frontend.

## When to use this skill
- Quando l'utente chiede di mappare o documentare l'architettura tecnica del sistema.
- Quando si aggiungono o modificano integrazioni critiche (es. DocuSign, NetSuite, gateway di pagamento) e occorre documentarne i flussi.
- Quando si aggiorna lo schema del database (Prisma, MySQL) o la pipeline delle API e bisogna aggiornare la documentazione esistente.
- Quando l'utente chiede esplicitamente di generare documenti "architecture_part1.md" e "architecture_part2.md".

---

## Workflow

L'agente deve seguire rigorosamente questo processo in 4 fasi:

```mermaid
graph TD
    Start["Fase 1: Rilevamento & Check di Aggiornamento"] --> CheckExist{"Esistono versioni precedenti?"}
    CheckExist -- Sì --> Merge["Fase 2: Analisi Differenziale & Aggiornamento"]
    CheckExist -- No --> Discover["Fase 2: Analisi da Zero & Scansione"]
    Merge --> Draft["Fase 3: Stesura Documenti (Part 1 & 2)"]
    Discover --> Draft
    Draft --> Validate["Fase 4: Loop di Validazione & Review"]
```

### Checklist di Esecuzione
- [ ] **Fase 1: Rilevamento & Check di Aggiornamento**
  - Chiedere all'utente (o cercare nel workspace) se esistono documenti architetturali precedenti (es. in `docs/architecture/`).
  - Se esistono, farsi fornire i percorsi/contenuti o cercarli via grep/find.
- [ ] **Fase 2: Analisi Tecnica**
  - **Se Aggiornamento**: Analizzare le differenze tra i vecchi file e il codice sorgente attuale (es. nuovi endpoint Express, modifiche a schema Prisma, nuovi store Zustand, modifiche ai servizi). Mappare le discrepanze.
  - **Se da Zero**: Esplorare l'intero workspace: backend (server, controller, service, middleware), database (schema.prisma o SQL), servizi esterni (NetSuite, DocuSign), e frontend (routing, Zustand, React Query hooks).
- [ ] **Fase 3: Stesura dei Documenti (Split in 2 Parti)**
  - Generare la documentazione dividendo l'output in due parti per evitare limitazioni di dimensione dei file e mantenere la leggibilità.
  - Utilizzare i template in `examples/` per garantire lo stesso identico livello di precisione tecnica, schemi JSON e diagrammi Mermaid.
- [ ] **Fase 4: Validazione & Review**
  - Verificare che tutti gli endpoint abbiano request/response completi (no placeholder come `...`).
  - Verificare la validità della sintassi di tutti i diagrammi Mermaid (usare doppi apici per stringhe speciali).
  - Assicurarsi che i percorsi dei file usino lo slash `/` come separatore.

---

## Deep Technical Guidelines & Output Requirements

L'agente non deve mai produrre descrizioni astratte o generiche. La documentazione prodotta deve rispettare i seguenti standard di profondità tecnica:

### 1. Rappresentazione Grafica (Mermaid)
- **Overview di Sistema**: Diagramma di blocco (`graph TB`) che mostra l'interazione tra i moduli frontend, backend, database e tutti i microservizi o API esterne.
- **Database ERD**: Schema entità-relazione completo (`erDiagram`) che elenca campi, chiavi primarie/esterne, relazioni (es. `||--o{`) e tipi di dato.
- **Flussi Sequenziali**: Diagrammi di sequenza (`sequenceDiagram`) dettagliati per flussi critici (autenticazione, webhook, integrazioni transazionali multi-step).

### 2. Dettaglio delle API (Reference Completa)
Ogni endpoint documentato deve includere obbligatoriamente:
- **Metodo e Path** (es. `POST /api/offers/:id/sync`).
- **Scopo e Middleware associati** (es. `verifyDocuSignHMAC`).
- **Request Payload** completo in formato JSON valido.
- **Response Payload (Successo 200/201)** completo con tutti i campi tipizzati.
- **Tabella degli errori** mappando gli HTTP Code e le stringhe dei codici d'errore applicativi.

### 3. Pipeline di Integrazione Esterna
Mappare ogni passo delle chiamate REST esterne con diagrammi di sequenza dedicati che mostrano:
- payload esatti inviati all'API di terze parti.
- gestione dello stato e log di database associati (es. `NetsuiteLog` `PROCESSING` -> `SUCCESS`/`ERROR`).
- comportamento in caso di fallimenti parziali (mancanza di rollback automatici, etc.).

### 4. Architettura Frontend
Delineare con tabelle e strutture ad albero:
- **Routing**: Tabella delle pagine con i relativi guard/layout applicati.
- **State Management**: Nomi degli store Zustand e loro esatto scopo.
- **Data Fetching**: Tutti gli hook custom React Query indicando l'endpoint associato, il metodo e il comportamento di caching.
- **Services Layer**: Struttura dei file di servizio Axios e impostazione degli interceptor (es. gestione del 401).

---

## Resources & Templates
- [Template Parte 1](examples/architecture_template_part1.md)
- [Template Parte 2](examples/architecture_template_part2.md)

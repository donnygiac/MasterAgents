# 🏗️ [Nome Progetto] — Architettura AS-IS (Parte 2)

> **Flussi Avanzati, Integrazioni Esterne, Frontend Architecture**

---

## 6. Flussi Complessi / Integrazioni di Firma

### 6.1 Inizializzazione Flusso
*Spiegare come viene inizializzato il flusso di firma o un flusso equivalente.*

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant EXT as External Service

    FE->>BE: POST /api/signature/initialize
    BE->>EXT: Setup Transaction
    EXT-->>BE: Transaction Details
    BE-->>FE: URL/ID di transazione
```

**Payload inviato al Servizio Esterno:**
```json
{
  "transaction_id": "123456",
  "recipient": {
    "email": "user@example.com",
    "name": "Nome Cognome"
  }
}
```

### 6.2 Callback Webhook
*Fornire specifiche sui webhook di callback ricevuti, validazione dell'integrità (HMAC) e gestione asincrona.*

> ⚠️ [NOTE/WARNING] Descrivere requisiti di sicurezza (es. risposta immediata 200, processing asincrono in background).

```mermaid
sequenceDiagram
    participant EXT as External Webhook
    participant BE as Backend
    participant DB as Database

    EXT->>BE: Callback payload (HMAC check)
    BE-->>EXT: 200 Received (Immediate)
    Note over BE: Asynchronous Processing
    BE->>DB: Log Transaction status
```

---

## 7. Pipeline d'Integrazione Transazionali (es. ERP / CRM)

*Spiegare le pipeline di sincronizzazione multi-step verso sistemi esterni.*

```mermaid
sequenceDiagram
    participant BE as Backend
    participant ERP as External ERP
    participant DB as Database

    Note over BE: Step 1: Create Entity
    BE->>ERP: POST /entities
    ERP-->>BE: {id: "ERP-123"}
    BE->>DB: Update Local Entity with ERP-123

    Note over BE: Step 2: Transform / Process
    BE->>ERP: POST /entities/transform
    ERP-->>BE: {success: true}
```

### 7.1 Payload Dettagliati Step-by-Step
*Fornire i payload e i verbi HTTP per ciascuno step della pipeline.*

---

## 8. Sincronizzazioni Asincrone (Cron Jobs)

**Schedule:** [es. Ogni giorno alle 05:00 (`0 5 * * *`)]
**Trigger manuale:** [Endpoint del trigger manuale admin]

```mermaid
sequenceDiagram
    participant CRON as Cron Service
    participant BE as Backend
    participant ERP as External ERP
    participant DB as Database

    CRON->>BE: Trigger Job
    BE->>ERP: Fetch Delta/Updates
    ERP-->>BE: Item List
    loop Per ogni item
        BE->>DB: Sync database local state
    end
```

---

## 9. Admin APIs (`/api/admin`)

> ⚠️ Tutte le route richiedono il ruolo [ADMIN / SUPERUSER]

#### `GET /api/admin/users`
**Response:** Lista utenti con privilegi.

---

## 10. Frontend Architecture

### 10.1 Struttura Pagine & Routing
*Elencare le pagine dell'applicazione con i guard e i layout applicati.*

| Path | Pagina | Guard / Permessi | Layout / UI |
|------|--------|------------------|-------------|
| `/` | Dashboard | AuthGuard | MainLayout |
| `/admin` | Admin Panel | AdminGuard | AdminLayout |

### 10.2 State Management (Zustand/Redux)
*Elencare gli Store globali con il loro scopo specifico.*

| Store | Tecnologia | Scopo |
|-------|-----------|-------|
| `useAuthStore` | Zustand | Stato autenticazione utente |

### 10.3 Data Fetching (React Query / SWR Hooks)
*Elencare gli hook custom di fetching associati alle API.*

| Hook Custom | Endpoint Chiamato | Metodo | Caching / Refetching |
|-------------|-------------------|--------|----------------------|
| `use<Entita>` | `GET /api/<entita>` | GET | Paginated, cache time 5m |

### 10.4 Services Layer (Axios / Fetch Clients)
*Spiegare la configurazione dell'istanza client HTTP (baseURL, interceptors, gestione scadenze token).*

---

## 11. Flusso End-to-End Completo

*Un diagramma di sequenza master che illustra l'intero ciclo di vita di un flusso aziendale (Happy Path).*

```mermaid
sequenceDiagram
    participant UT as Utente
    participant FE as Frontend UI
    participant BE as Backend API
    participant DB as Database
    participant EXT as Servizi Esterni

    UT->>FE: Inizia Azione
    FE->>BE: Richiesta Dati
    BE->>DB: Query
    DB-->>BE: Dati
    BE-->>FE: Risposta
    FE-->>UT: Mostra Schermata
```

---

## 12. External Service Integration Map

*Mappa riassuntiva di tutte le integrazioni con variabili d'ambiente e URL.*

| Servizio | Variabile d'Ambiente URL | Endpoint Utilizzati | Scopo |
|----------|--------------------------|---------------------|-------|
| [Servizio] | `SERVICE_BASE_URL` | `POST /action` | [Scopo] |

---

## 13. Logging & Audit System

*Delineare come vengono salvati i log di sistema per audit tecnici.*

| Tabella Log | Trigger | Stato Master | Tabella Dettaglio associata |
|-------------|---------|--------------|-----------------------------|
| `SyncLog` | Cron / Trigger manuale | SUCCESS / ERROR | `SyncLogDetail` (INFO/ERROR) |

---

## 14. Logiche di Business Critiche (Formule)

*Documentare le formule matematiche o le logiche decisionali implementate nel codice per trasparenza.*

```
Formula di calcolo:
1. Totale = Somma(Prezzi * Quantità)
2. Importo Rata = Totale / Numero Rate
```

---

## 15. Security Summary

*Sintesi dei meccanismi di sicurezza applicati.*

| Aspetto | Dettagli di Implementazione |
|---------|-----------------------------|
| **Autenticazione** | [es. Cookie HttpOnly, JWT] |
| **CORS** | [es. Whitelist da FRONTEND_URL] |
| **Autorizzazione (RBAC)** | [es. Middleware per ruoli ADMIN/AGENT] |
| **Integrità Webhook** | [es. Verifica firma HMAC SHA256] |
| **Validazione Input** | [es. Validazione schemi Zod su parametri e body] |

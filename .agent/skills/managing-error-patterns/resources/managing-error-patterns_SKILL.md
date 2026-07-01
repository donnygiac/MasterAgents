---
name: managing-error-patterns
description: Padroneggia i pattern di gestione degli errori in Node.js/TypeScript, inclusi eccezioni tipizzate (AppError), tipi Result, propagazione degli errori e degradazione aggraziata per costruire applicazioni resilienti. Usare durante l'implementazione della gestione degli errori, la progettazione di API o il miglioramento dell'affidabilità dell'applicazione.
---

# Pattern di Gestione degli Errori (Node.js / TypeScript)

Costruisci applicazioni resilienti con strategie di gestione degli errori robuste che gestiscano i fallimenti in modo aggraziato e forniscano eccellenti esperienze di debug.

## Quando usare questa skill

- Implementazione della gestione degli errori in nuove funzionalità.
- Progettazione di API Express resilienti agli errori.
- Debug di problemi in produzione.
- Miglioramento dell'affidabilità dell'applicazione.
- Creazione di messaggi di errore migliori per utenti e sviluppatori (vedi `resources/error-message-guide.md`).
- Implementazione di pattern come retry e circuit breaker.
- Gestione di errori asincroni/concorrenti (vedi `resources/async-error-handling.md`).

> Nota: quando questa skill viene usata insieme a `analyzing-architecture`, ogni endpoint documentato deve includere la tabella errori (HTTP code ↔ codice applicativo) — usa la gerarchia definita qui come fonte di verità per quei codici.

## Concetti Fondamentali

### 1. Filosofie di Gestione degli Errori

- **Eccezioni**: try-catch, interrompe il flusso di controllo. Usale per errori inaspettati o condizioni eccezionali.
- **Tipi Result**: successo/fallimento esplicito, approccio funzionale. Usali per errori previsti (validazione, parsing).
- **Panic/Crash**: solo per errori irrecuperabili o bug di programmazione (mai in produzione senza logging).

### 2. Categorie di Errore

**Recuperabili**: timeout di rete, file mancanti, input utente non valido, rate limit API.
**Irrecuperabili**: memoria esaurita, stack overflow, bug di programmazione (null pointer, ecc.).

## Gerarchia di Eccezioni del Progetto

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} non trovato`, "NOT_FOUND", 404, { resource, id });
  }
}

class NetworkError extends AppError {
  constructor(message: string, public service: string, details?: Record<string, any>) {
    super(message, "NETWORK_ERROR", 502, details);
  }
}

class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "DATABASE_ERROR", 500, details);
  }
}

// Utilizzo
function getUser(id: string): User {
  const user = users.find((u) => u.id === id);
  if (!user) throw new NotFoundError("Utente", id);
  return user;
}
```

Per la struttura completa della gerarchia (quando aggiungere categorie, come incapsulare errori Prisma), vedi `resources/exception-hierarchy-design.md`.

## Pattern del Tipo Result

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}
function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function parseJSON<T>(json: string): Result<T, SyntaxError> {
  try {
    return Ok(JSON.parse(json) as T);
  } catch (error) {
    return Err(error as SyntaxError);
  }
}

function chain<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}
```

## Gestione Errori Asincroni

```typescript
async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    const user = await getUser(userId);
    return await getOrders(user.id);
  } catch (error) {
    if (error instanceof NotFoundError) return [];
    if (error instanceof NetworkError) return retryFetchOrders(userId);
    throw error; // rilancia errori inaspettati
  }
}

function fetchData(url: string): Promise<Data> {
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new NetworkError(`HTTP ${response.status}`, url);
      return response.json();
    })
    .catch((error) => {
      console.error("Fetch fallito:", error);
      throw error;
    });
}
```

Per Promise, unhandled rejection e race condition, vedi `resources/async-error-handling.md`.

## Pattern Universali

### Pattern 1: Circuit Breaker

Previene fallimenti a cascata quando un servizio esterno (es. NetSuite, DocuSign) è giù.

```typescript
enum CircuitState { CLOSED, OPEN, HALF_OPEN }

class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state = CircuitState.CLOSED;
  private lastFailureTime = 0;

  constructor(
    private failureThreshold = 5,
    private timeoutMs = 60_000,
    private successThreshold = 2,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new NetworkError("Circuit breaker è OPEN", "unknown");
      }
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (e) {
      this.onFailure();
      throw e;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) this.state = CircuitState.CLOSED;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) this.state = CircuitState.OPEN;
  }
}
```

### Pattern 2: Aggregazione degli Errori

Raccoglie errori multipli invece di fallire al primo (utile per validazione form).

```typescript
class ErrorCollector {
  private errors: Error[] = [];

  add(error: Error): void { this.errors.push(error); }
  hasErrors(): boolean { return this.errors.length > 0; }
  getErrors(): Error[] { return [...this.errors]; }

  throw(): never {
    if (this.errors.length === 1) throw this.errors[0];
    throw new AggregateError(this.errors, `Si sono verificati ${this.errors.length} errori`);
  }
}

function validateUser(data: any): User {
  const errors = new ErrorCollector();
  if (!data.email) errors.add(new ValidationError("L'email è obbligatoria"));
  if (!data.name || data.name.length < 2) errors.add(new ValidationError("Il nome deve contenere almeno 2 caratteri"));
  if (errors.hasErrors()) errors.throw();
  return data as User;
}
```

### Pattern 3: Degradazione Aggraziata (Graceful Degradation)

```typescript
async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (e) {
    console.error("Funzione primaria fallita:", e);
    return fallback();
  }
}

const profile = await withFallback(
  () => fetchFromCache(userId),
  () => fetchFromDatabase(userId),
);
```

Per strategie di retry, fallback multipli e queueing, vedi `resources/error-recovery-strategies.md`.

## Best Practice

1. **Fail Fast**: valida l'input presto, fallisci velocemente.
2. **Preserva il Contesto**: includi stack trace, metadati, timestamp, `code`.
3. **Messaggi Significativi**: spiega cosa è successo e come risolvere (vedi `resources/error-message-guide.md`).
4. **Log Appropriati**: errore reale = log; fallimento atteso (es. validazione) = non inondare i log.
5. **Gestisci al Livello Giusto**: cattura dove puoi gestire in modo significativo.
6. **Pulisci le Risorse**: usa `try/finally`, chiudi connessioni Prisma esplicitamente.
7. **Non Inghiottire gli Errori**: logga o rilancia, mai `catch` vuoti.
8. **Errori Type-Safe**: estendi sempre `AppError`, mai `throw` di stringhe o oggetti generici.

```typescript
// Esempio completo: gestione errori in un service Express
async function processOrder(orderId: string): Promise<Order> {
  if (!orderId) throw new ValidationError("ID ordine obbligatorio");

  const order = await db.getOrder(orderId);
  if (!order) throw new NotFoundError("Ordine", orderId);

  try {
    const paymentResult = await paymentService.charge(order.total);
    order.status = "completed";
    order.paymentId = paymentResult.id;
    await db.save(order);
    return order;
  } catch (e) {
    if (e instanceof AppError) throw e;
    console.error(`Pagamento fallito per l'ordine ${orderId}:`, e);
    throw new NetworkError("Elaborazione pagamento fallita", "payment_service", {
      orderId,
      amount: order.total,
    });
  }
}
```

## Trappole Comuni (Pitfalls)

- **Catturare in modo troppo ampio**: `catch (e: any)` senza discriminare nasconde i bug.
- **Blocchi Catch vuoti**: inghiottire silenziosamente gli errori.
- **Loggare e rilanciare**: crea voci di log duplicate.
- **Non pulire**: dimenticare di chiudere connessioni Prisma/DB.
- **Messaggi di errore poveri**: "Si è verificato un errore" non è utile.
- **Ignorare errori asincroni**: `unhandledRejection` non gestite.

## Risorse

- **[`resources/exception-hierarchy-design.md`](resources/exception-hierarchy-design.md)**: progettazione delle gerarchie di classi di errore.
- **[`resources/error-recovery-strategies.md`](resources/error-recovery-strategies.md)**: pattern di recupero per diversi scenari.
- **[`resources/async-error-handling.md`](resources/async-error-handling.md)**: gestione degli errori nel codice concorrente.
- **[`resources/error-handling-checklist.md`](resources/error-handling-checklist.md)**: checklist di revisione per la gestione degli errori.
- **[`resources/error-message-guide.md`](resources/error-message-guide.md)**: scrivere messaggi di errore utili (segue il tono in [`../maintaining-brand-identity/resources/voice-tone.md`](../maintaining-brand-identity/resources/voice-tone.md)).
- **[`scripts/error-analyzer.py`](scripts/error-analyzer.py)**: analizza i pattern di errore nei log.

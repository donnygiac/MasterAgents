---
name: managing-error-patterns
description: Padroneggia i pattern di gestione degli errori in vari linguaggi, inclusi eccezioni, tipi Result, propagazione degli errori e degradazione aggraziata per costruire applicazioni resilienti. Usare durante l'implementazione della gestione degli errori, la progettazione di API o il miglioramento dell'affidabilità delle applicazioni.
---

# Pattern di Gestione degli Errori

Costruisci applicazioni resilienti con strategie di gestione degli errori robuste che gestiscano i fallimenti in modo aggraziato e forniscano eccellenti esperienze di debug.

## Quando usare questa skill

- Implementazione della gestione degli errori in nuove funzionalità.
- Progettazione di API resilienti agli errori.
- Debug di problemi in produzione.
- Miglioramento dell'affidabilità dell'applicazione.
- Creazione di messaggi di errore migliori per utenti e sviluppatori.
- Implementazione di pattern come retry e circuit breaker.
- Gestione di errori asincroni/concorrenti.
- Costruzione di sistemi distribuiti tolleranti ai guasti.

## Concetti Fondamentali

### 1. Filosofie di Gestione degli Errori

**Eccezioni vs Tipi Result:**

- **Eccezioni**: try-catch tradizionale, interrompe il flusso di controllo.
- **Tipi Result**: Successo/fallimento esplicito, approccio funzionale.
- **Codici di Errore**: Stile C, richiede disciplina.
- **Tipi Option/Maybe**: Per valori nullable.

**Quando usare ciascuno:**

- Eccezioni: Errori inaspettati, condizioni eccezionali.
- Tipi Result: Errori previsti, fallimenti di validazione.
- Panic/Crash: Errori irrecuperabili, bug di programmazione.

### 2. Categorie di Errore

**Errori Recuperabili:**

- Timeout di rete.
- File mancanti.
- Input utente non valido.
- Limiti di frequenza (rate limits) delle API.

**Errori Irrecuperabili:**

- Memoria esaurita (Out of memory).
- Stack overflow.
- Bug di programmazione (null pointer, ecc.).

## Pattern Specifici per Linguaggio

### Gestione Errori in Python

**Gerarchia di Eccezioni Personalizzate:**

```python
class ApplicationError(Exception):
    """Eccezione base per tutti gli errori dell'applicazione."""
    def __init__(self, message: str, code: str = None, details: dict = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}
        self.timestamp = datetime.utcnow()

class ValidationError(ApplicationError):
    """Sollevata quando la validazione fallisce."""
    pass

class NotFoundError(ApplicationError):
    """Sollevata quando una risorsa non viene trovata."""
    pass

class ExternalServiceError(ApplicationError):
    """Sollevata quando un servizio esterno fallisce."""
    def __init__(self, message: str, service: str, **kwargs):
        super().__init__(message, **kwargs)
        self.service = service

# Utilizzo
def get_user(user_id: str) -> User:
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise NotFoundError(
            f"Utente non trovato",
            code="USER_NOT_FOUND",
            details={"user_id": user_id}
        )
    return user
```

**Context Manager per la Pulizia:**

```python
from contextlib import contextmanager

@contextmanager
def database_transaction(session):
    """Assicura che la transazione venga confermata o annullata."""
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise
    finally:
        session.close()

# Utilizzo
with database_transaction(db.session) as session:
    user = User(name="Alice")
    session.add(user)
    # Commit o rollback automatico
```

**Retry con Backoff Esponenziale:**

```python
import time
from functools import wraps
from typing import TypeVar, Callable

T = TypeVar('T')

def retry(
    max_attempts: int = 3,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,)
):
    """Decoratore di retry con backoff esponenziale."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        sleep_time = backoff_factor ** attempt
                        time.sleep(sleep_time)
                        continue
                    raise
            raise last_exception
        return wrapper
    return decorator

# Utilizzo
@retry(max_attempts=3, exceptions=(NetworkError,))
def fetch_data(url: str) -> dict:
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
```

### Gestione Errori in TypeScript/JavaScript

**Classi di Errore Personalizzate:**

```typescript
// Classi di errore personalizzate
class ApplicationError extends Error {
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

class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} non trovato`, "NOT_FOUND", 404, { resource, id });
  }
}

// Utilizzo
function getUser(id: string): User {
  const user = users.find((u) => u.id === id);
  if (!user) {
    throw new NotFoundError("Utente", id);
  }
  return user;
}
```

**Pattern del Tipo Result:**

```typescript
// Tipo Result per la gestione esplicita degli errori
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// Funzioni helper
function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Utilizzo
function parseJSON<T>(json: string): Result<T, SyntaxError> {
  try {
    const value = JSON.parse(json) as T;
    return Ok(value);
  } catch (error) {
    return Err(error as SyntaxError);
  }
}

// Consumare Result
const result = parseJSON<User>(userJson);
if (result.ok) {
  console.log(result.value.name);
} else {
  console.error("Parse fallito:", result.error.message);
}

// Concatenare Result
function chain<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}
```

**Gestione Errori Asincroni:**

```typescript
// Async/await con gestione corretta degli errori
async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    const user = await getUser(userId);
    const orders = await getOrders(user.id);
    return orders;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return []; // Ritorna array vuoto se non trovato
    }
    if (error instanceof NetworkError) {
      // Logica di retry
      return retryFetchOrders(userId);
    }
    // Rilancia errori inaspettati
    throw error;
  }
}

// Gestione errori nelle Promise
function fetchData(url: string): Promise<Data> {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Fetch fallito:", error);
      throw error;
    });
}
```

### Gestione Errori in Rust

**Tipi Result e Option:**

```rust
use std::fs::File;
use std::io::{self, Read};

// Tipo Result per operazioni che possono fallire
fn read_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;  // L'operatore ? propaga gli errori
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// Tipi di errore personalizzati
#[derive(Debug)]
enum AppError {
    Io(io::Error),
    Parse(std::num::ParseIntError),
    NotFound(String),
    Validation(String),
}

impl From<io::Error> for AppError {
    fn from(error: io::Error) -> Self {
        AppError::Io(error)
    }
}

// Utilizzo di tipi di errore personalizzati
fn read_number_from_file(path: &str) -> Result<i32, AppError> {
    let contents = read_file(path)?;  // Converte automaticamente io::Error
    let number = contents.trim().parse()
        .map_err(AppError::Parse)?;   // Converte esplicitamente ParseIntError
    Ok(number)
}

// Option per valori nullable
fn find_user(id: &str) -> Option<User> {
    users.iter().find(|u| u.id == id).cloned()
}

// Combinare Option e Result
fn get_user_age(id: &str) -> Result<u32, AppError> {
    find_user(id)
        .ok_or_else(|| AppError::NotFound(id.to_string()))
        .map(|user| user.age)
}
```

### Gestione Errori in Go

**Ritorni di Errore Espliciti:**

```go
// Gestione errori di base
func getUser(id string) (*User, error) {
    user, err := db.QueryUser(id)
    if err != nil {
        return nil, fmt.Errorf("failed to query user: %w", err)
    }
    if user == nil {
        return nil, errors.New("user not found")
    }
    return user, nil
}

// Tipi di errore personalizzati
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed for %s: %s", e.Field, e.Message)
}

// Errori sentinella per il confronto
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrInvalidInput = errors.New("invalid input")
)

// Controllo errori
user, err := getUser("123")
if err != nil {
    if errors.Is(err, ErrNotFound) {
        // Gestisci non trovato
    } else {
        // Gestisci altri errori
    }
}

// Wrapping e unwrapping degli errori
func processUser(id string) error {
    user, err := getUser(id)
    if err != nil {
        return fmt.Errorf("process user failed: %w", err)
    }
    // Elabora utente
    return nil
}

// Unwrap degli errori
err := processUser("123")
if err != nil {
    var valErr *ValidationError
    if errors.As(err, &valErr) {
        fmt.Printf("Errore di validazione: %s\n", valErr.Field)
    }
}
```

## Pattern Universali

### Pattern 1: Circuit Breaker

Previene fallimenti a cascata in sistemi distribuiti.

```python
from enum import Enum
from datetime import datetime, timedelta
from typing import Callable, TypeVar

T = TypeVar('T')

class CircuitState(Enum):
    CLOSED = "closed"       # Funzionamento normale
    OPEN = "open"          # Fallimento, rifiuta richieste
    HALF_OPEN = "half_open"  # Test per vedere se recuperato

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: timedelta = timedelta(seconds=60),
        success_threshold: int = 2
    ):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.success_threshold = success_threshold
        self.failure_count = 0
        self.success_count = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = None

    def call(self, func: Callable[[], T]) -> T:
        if self.state == CircuitState.OPEN:
            if datetime.now() - self.last_failure_time > self.timeout:
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
            else:
                raise Exception("Circuit breaker è OPEN")

        try:
            result = func()
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise

    def on_success(self):
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
                self.success_count = 0

    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

# Utilizzo
circuit_breaker = CircuitBreaker()

def fetch_data():
    return circuit_breaker.call(lambda: api_esterna.get_data())
```

### Pattern 2: Aggregazione degli Errori

Raccoglie errori multipli invece di fallire al primo errore.

```typescript
class ErrorCollector {
  private errors: Error[] = [];

  add(error: Error): void {
    this.errors.push(error);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): Error[] {
    return [...this.errors];
  }

  throw(): never {
    if (this.errors.length === 1) {
      throw this.errors[0];
    }
    throw new AggregateError(
      this.errors,
      `Si sono verificati ${this.errors.length} errori`,
    );
  }
}

// Utilizzo: Validare più campi
function validateUser(data: any): User {
  const errors = new ErrorCollector();

  if (!data.email) {
    errors.add(new ValidationError("L'email è obbligatoria"));
  } else if (!isValidEmail(data.email)) {
    errors.add(new ValidationError("L'email non è valida"));
  }

  if (!data.name || data.name.length < 2) {
    errors.add(new ValidationError("Il nome deve contenere almeno 2 caratteri"));
  }

  if (!data.age || data.age < 18) {
    errors.add(new ValidationError("L'età deve essere di almeno 18 anni"));
  }

  if (errors.hasErrors()) {
    errors.throw();
  }

  return data as User;
}
```

### Pattern 3: Degradazione Aggraziata (Graceful Degradation)

Fornisce funzionalità di ripiego (fallback) quando si verificano errori.

```python
from typing import Optional, Callable, TypeVar

T = TypeVar('T')

def with_fallback(
    primary: Callable[[], T],
    fallback: Callable[[], T],
    log_error: bool = True
) -> T:
    """Prova la funzione primaria, ripiega sul fallback in caso di errore."""
    try:
        return primary()
    except Exception as e:
        if log_error:
            logger.error(f"Funzione primaria fallita: {e}")
        return fallback()

# Utilizzo
def get_user_profile(user_id: str) -> UserProfile:
    return with_fallback(
        primary=lambda: fetch_from_cache(user_id),
        fallback=lambda: fetch_from_database(user_id)
    )

# Fallback multipli
def get_exchange_rate(currency: str) -> float:
    return (
        try_function(lambda: api_provider_1.get_rate(currency))
        or try_function(lambda: api_provider_2.get_rate(currency))
        or try_function(lambda: cache.get_rate(currency))
        or DEFAULT_RATE
    )

def try_function(func: Callable[[], Optional[T]]) -> Optional[T]:
    try:
        return func()
    except Exception:
        return None
```

## Best Practice

1. **Fail Fast**: Valida l'input presto, fallisci velocemente.
2. **Preserva il Contesto**: Includi stack trace, metadati, timestamp.
3. **Messaggi Significativi**: Spiega cosa è successo e come risolvere.
4. **Log Appropriati**: Errore = log, fallimento atteso = non inondare i log.
5. **Gestisci al Livello Giusto**: Cattura dove puoi gestire in modo significativo.
6. **Pulisci le Risorse**: Usa try-finally, context manager, defer.
7. **Non Inghiottire gli Errori**: Logga o rilancia, non ignorare in silenzio.
8. **Errori Type-Safe**: Usa errori tipizzati quando possibile.

```python
# Esempio di buona gestione degli errori
def process_order(order_id: str) -> Order:
    """Elabora l'ordine con una gestione completa degli errori."""
    try:
        # Valida input
        if not order_id:
            raise ValidationError("ID ordine obbligatorio")

        # Recupera ordine
        order = db.get_order(order_id)
        if not order:
            raise NotFoundError("Ordine", order_id)

        # Elabora pagamento
        try:
            payment_result = payment_service.charge(order.total)
        except PaymentServiceError as e:
            # Logga e avvolgi l'errore del servizio esterno
            logger.error(f"Pagamento fallito per l'ordine {order_id}: {e}")
            raise ExternalServiceError(
                f"Elaborazione pagamento fallita",
                service="payment_service",
                details={"order_id": order_id, "amount": order.total}
            ) from e

        # Aggiorna ordine
        order.status = "completed"
        order.payment_id = payment_result.id
        db.save(order)

        return order

    except ApplicationError:
        # Rilancia errori noti dell'applicazione
        raise
    except Exception as e:
        # Logga errori inaspettati
        logger.exception(f"Errore inaspettato durante l'elaborazione dell'ordine {order_id}")
        raise ApplicationError(
            "Elaborazione ordine fallita",
            code="INTERNAL_ERROR"
        ) from e
```

## Trappole Comuni (Pitfalls)

- **Catturare in modo troppo ampio**: `except Exception` nasconde i bug.
- **Blocchi Catch vuoti**: Inghiottire silenziosamente gli errori.
- **Loggare e rilanciare**: Crea voci di log duplicate.
- **Non pulire**: Dimenticare di chiudere file, connessioni.
- **Messaggi di errore poveri**: "Si è verificato un errore" non è utile.
- **Restituire codici di errore**: Usa eccezioni o tipi Result.
- **Ignorare errori asincroni**: Rejection di Promise non gestite.

## Risorse

- **[`resources/exception-hierarchy-design.md`](resources/exception-hierarchy-design.md)**: Progettazione delle gerarchie di classi di errore.
- **[`resources/error-recovery-strategies.md`](resources/error-recovery-strategies.md)**: Pattern di recupero per diversi scenari.
- **[`resources/async-error-handling.md`](resources/async-error-handling.md)**: Gestione degli errori nel codice concorrente.
- **[`resources/error-handling-checklist.md`](resources/error-handling-checklist.md)**: Checklist di revisione per la gestione degli errori.
- **[`resources/error-message-guide.md`](resources/error-message-guide.md)**: Scrivere messaggi di errore utili.
- **[`scripts/error-analyzer.py`](scripts/error-analyzer.py)**: Analizza i pattern di errore nei log.

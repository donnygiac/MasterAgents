# Progettazione della Gerarchia di Eccezioni

Una buona gerarchia di eccezioni aiuta a catturare gli errori al giusto livello di astrazione.

> **Attenzione**: se il progetto ha già un modulo errori, la fonte di verità è QUEL file (vedi
> "Fonte di verità" in `SKILL.md`) — non questa pagina. La gerarchia sotto è la **proposta di
> riferimento per progetti greenfield** che non hanno ancora nulla.

## Gerarchia di riferimento (greenfield)

```
AppError (base)
├── ValidationError     → 400, input non valido (con details per campo)
├── UnauthorizedError   → 401, autenticazione mancante/invalida
├── ForbiddenError      → 403, autenticazione ok ma permessi insufficienti
├── NotFoundError       → 404, risorsa non trovata
├── ConflictError       → 409, violazione di unicità / stato in conflitto
├── NetworkError        → 502, chiamata a servizio esterno fallita
└── DatabaseError       → 500, fallimento a livello ORM/DB
```

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Risorsa già presente.') {
    super(message, 409, 'CONFLICT');
  }
}

export class NetworkError extends AppError {
  constructor(message: string, public readonly service: string) {
    super(message, 502, 'NETWORK_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, 500, 'DATABASE_ERROR');
  }
}
```

## Linee Guida

1. **Un'unica classe base**: tutte le eccezioni applicative la estendono. Mai lanciare `Error`
   generico o stringhe.
2. **`NetworkError` per tutto ciò che è esterno**: usa il campo `service` per distinguere la
   fonte, non creare una classe per ogni integrazione. Crea una classe dedicata solo quando il
   *client deve reagire diversamente* (statusCode o `code` diverso).
3. **`DatabaseError` per l'ORM**: incapsula sempre l'errore originale in `cause` per non perdere
   lo stack. I casi noti (es. vincolo unico) vanno intercettati a monte nel service con un
   errore di dominio dal messaggio parlante.
4. **`code` sempre presente e stabile**: è la chiave usata da `scripts/error-analyzer.py` per
   aggregare i log, da `architecture-analysis` per la tabella errori degli endpoint, e dal
   frontend per ramificare. Non rinominare i `code` esistenti.
5. **Metadati nei `details`/campi dedicati**: id, campi coinvolti, parametri — mai nel messaggio
   testuale (che deve restare leggibile per l'utente, vedi `error-message-guide.md`).
6. **Ogni classe nuova ha un commento sul *perché*** esiste (quale caso non era coperto), non
   sul cosa fa.

## Quando aggiungere una nuova categoria

Prima di crearne una nuova, chiediti:
- È davvero un dominio di errore diverso, o è una variante di una classe esistente?
- Serve uno `statusCode` HTTP diverso o un `code` su cui il client deve ramificare? Se sì,
  probabilmente merita una classe propria.
- Hai eseguito `codegraph impact <ClasseBase>` per vedere chi è impattato?
- Aggiorna la tabella "Gerarchia del progetto" in `SKILL.md` nello stesso commit.

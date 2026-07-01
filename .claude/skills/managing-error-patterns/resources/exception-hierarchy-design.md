# Progettazione della Gerarchia di Eccezioni

Una buona gerarchia di eccezioni aiuta a catturare gli errori al giusto livello di astrazione. Questa è **la gerarchia reale già usata nel codice** — non introdurre nomi alternativi (es. `ApplicationError`, `ExternalServiceError`) per evitare incoerenze.

## Gerarchia Standard del Progetto

```
AppError (base)
├── ValidationError    → 400, input non valido
├── NotFoundError       → 404, risorsa non trovata
├── NetworkError        → 502/504, chiamata di rete o servizio esterno fallita (DocuSign, NetSuite, fetch)
└── DatabaseError       → 500, fallimento a livello di Prisma/MySQL
```

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,          // es. "NETWORK_ERROR" — usato anche da scripts/error-analyzer.py
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
```

## Linee Guida

1. **Un'unica classe base**: tutte le eccezioni applicative estendono `AppError`. Mai lanciare `Error` generico o stringhe.
2. **`NetworkError` per tutto ciò che è esterno**: DocuSign, NetSuite, fetch verso API terze — usa il campo `service` per distinguere la fonte, non creare una classe per ogni integrazione.
3. **`DatabaseError` per Prisma/MySQL**: usalo per errori di connessione, vincoli violati, query fallite. Incapsula sempre l'errore Prisma originale in `details.cause` per non perdere lo stack.
4. **`code` sempre presente e stabile**: è la chiave usata da `scripts/error-analyzer.py` per aggregare i log e da `analyzing-architecture` per la tabella errori degli endpoint. Non rinominare i `code` esistenti senza aggiornare entrambi.
5. **Metadati nei `details`**: id, campi coinvolti, parametri — mai nel messaggio testuale (che deve restare leggibile per l'utente, vedi `error-message-guide.md`).

## Quando aggiungere una nuova categoria

Prima di crearne una nuova, chiediti:
- È davvero un dominio di errore diverso, o è una variante di `NetworkError`/`DatabaseError` esistente?
- Serve uno `statusCode` HTTP diverso? Se sì, probabilmente merita una classe propria.
- Aggiorna sia questo file sia gli esempi in `SKILL.md` quando ne introduci una — devono restare sincronizzati.

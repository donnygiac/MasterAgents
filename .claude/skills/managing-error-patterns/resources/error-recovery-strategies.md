# Strategie di Recupero dagli Errori

Come recuperare correttamente quando qualcosa va storto, con esempi concreti per lo stack Node/TypeScript del progetto.

## Strategie

### Retry con Backoff Esponenziale

Usalo per chiamate a servizi esterni (DocuSign, NetSuite) che possono fallire per motivi transitori.

```typescript
async function retry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, backoffMs = 500 }: { maxAttempts?: number; backoffMs?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

// Utilizzo
const result = await retry(() => netsuiteClient.syncOffer(offerId), { maxAttempts: 3 });
```

⚠️ Non fare retry su `ValidationError` — un input non valido non diventa valido riprovando. Il retry ha senso solo per `NetworkError` o `DatabaseError` transitori (es. connessione persa temporaneamente).

### Fallback

Usa un valore predefinito o una cache se il servizio primario fallisce (vedi anche il pattern "Graceful Degradation" in `SKILL.md`).

### Failover

Passa a un'istanza o un database secondario in caso di `DatabaseError` persistente. Non applicabile con una singola istanza MySQL: valutalo solo se il progetto introduce una read replica.

### Queueing

Salva l'operazione in una coda per rielaborarla più tardi, invece di far fallire la richiesta dell'utente per un `NetworkError` temporaneo (es. NetSuite giù → accoda la sincronizzazione, rispondi comunque all'utente).

```typescript
// Esempio concettuale — usa la libreria di code già presente nel progetto (es. BullMQ),
// non introdurne una nuova senza verificare con il team.
async function syncWithFallbackQueue(offerId: string) {
  try {
    await netsuiteClient.syncOffer(offerId);
  } catch (error) {
    if (error instanceof NetworkError) {
      await offerSyncQueue.add("retry-sync", { offerId });
      return; // l'utente non deve aspettare il retry
    }
    throw error;
  }
}
```

### User Intervention

Quando l'errore dipende dall'input (`ValidationError`), non provare a recuperare automaticamente: restituisci un messaggio chiaro (vedi `error-message-guide.md`) e lascia che sia l'utente a correggere.

## Come scegliere la strategia giusta

| Tipo di errore | Strategia consigliata |
|---|---|
| `ValidationError` | User Intervention — mai retry |
| `NetworkError` (timeout, 5xx da servizio esterno) | Retry con backoff → se persiste, Queueing o Fallback |
| `NetworkError` (down prolungato) | Circuit Breaker (vedi `SKILL.md`) + Fallback |
| `DatabaseError` (connessione persa) | Retry con backoff breve → se persiste, alert/failover |
| `NotFoundError` | Nessun recupero automatico — è un esito legittimo, non un fallimento |

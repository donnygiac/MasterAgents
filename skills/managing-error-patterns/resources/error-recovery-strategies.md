# Strategie di Recupero dagli Errori

Come recuperare correttamente quando qualcosa va storto, con esempi per lo stack Node/TypeScript.
Le classi di errore negli esempi (`ValidationError`, `NetworkError`, ...) sono quelle della
gerarchia del progetto (vedi tabella in `SKILL.md`): adatta i nomi se il progetto ne usa altri.

## Strategie

### Retry con Backoff Esponenziale

Usalo per chiamate a servizi esterni che possono fallire per motivi transitori.

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
const result = await retry(() => externalClient.syncEntity(entityId), { maxAttempts: 3 });
```

⚠️ Non fare retry su errori di validazione — un input non valido non diventa valido riprovando.
Il retry ha senso solo per errori di rete o DB transitori (es. connessione persa temporaneamente).

### Fallback

Usa un valore predefinito o una cache se il servizio primario fallisce (vedi anche il pattern
"Degradazione aggraziata" in `SKILL.md`).

### Failover

Passa a un'istanza o un database secondario in caso di errore DB persistente. Non applicabile
con una singola istanza MySQL: valutalo solo se il progetto introduce una read replica.

### Queueing

Salva l'operazione in una coda per rielaborarla più tardi, invece di far fallire la richiesta
dell'utente per un errore di rete temporaneo (es. servizio esterno giù → accoda la
sincronizzazione, rispondi comunque all'utente).

```typescript
// Esempio concettuale — usa la libreria di code già presente nel progetto (es. BullMQ),
// non introdurne una nuova senza verificare con l'utente.
async function syncWithFallbackQueue(entityId: string) {
  try {
    await externalClient.syncEntity(entityId);
  } catch (error) {
    if (error instanceof NetworkError) {
      await syncQueue.add("retry-sync", { entityId });
      return; // l'utente non deve aspettare il retry
    }
    throw error;
  }
}
```

### User Intervention

Quando l'errore dipende dall'input (errore di validazione), non provare a recuperare
automaticamente: restituisci un messaggio chiaro (vedi `error-message-guide.md`) e lascia che
sia l'utente a correggere.

## Come scegliere la strategia giusta

| Tipo di errore | Strategia consigliata |
|---|---|
| Validazione input | User Intervention — mai retry |
| Rete/servizio esterno (timeout, 5xx) | Retry con backoff → se persiste, Queueing o Fallback |
| Servizio esterno giù a lungo | Circuit Breaker (vedi `SKILL.md`) + Fallback |
| DB (connessione persa) | Retry con backoff breve → se persiste, alert/failover |
| Risorsa non trovata | Nessun recupero automatico — è un esito legittimo, non un fallimento |

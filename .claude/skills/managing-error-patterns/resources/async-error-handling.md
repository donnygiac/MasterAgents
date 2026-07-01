# Gestione degli Errori Asincroni

Gestire i fallimenti nel codice concorrente e asincrono in Node.js/TypeScript.

## Punti chiave

- **Promise Rejection**: ogni Promise deve avere un `.catch()` o essere dentro un `try/catch` con `await`. Mai lasciare una Promise "fire and forget" senza gestione.
- **Unhandled Rejection**: configura un handler globale per catturare errori dimenticati (vedi sotto).
- **Race Conditions**: quando più operazioni async modificano lo stesso stato, usa lock applicativi o transazioni Prisma invece di assumere un ordine di esecuzione.
- **Timeout**: usa sempre un timeout per le chiamate esterne (fetch, servizi terzi) per evitare blocchi infiniti.

## Handler globale per Unhandled Rejection

```typescript
// In app.ts / server.ts, all'avvio
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection non gestita:", reason);
  // In produzione: logga con contesto strutturato, non terminare bruscamente il processo
  // a meno che l'errore non comprometta l'integrità dello stato dell'app.
});

process.on("uncaughtException", (error) => {
  console.error("Eccezione non catturata:", error);
  // Questo è più grave di unhandledRejection: valuta uno shutdown controllato.
  process.exit(1);
});
```

## Timeout con AbortController

```typescript
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError(`Timeout dopo ${timeoutMs}ms`, url);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

## Operazioni concorrenti: `Promise.all` vs `Promise.allSettled`

```typescript
// Promise.all: fallisce TUTTO al primo errore — usalo solo se le operazioni
// sono tutte necessarie e correlate.
const [user, orders] = await Promise.all([getUser(id), getOrders(id)]);

// Promise.allSettled: raccoglie successi e fallimenti separatamente —
// usalo quando le operazioni sono indipendenti (es. invio di notifiche multiple).
const results = await Promise.allSettled([
  notifyEmail(userId),
  notifySlack(userId),
]);
const failed = results.filter((r) => r.status === "rejected");
if (failed.length > 0) {
  console.error(`${failed.length} notifiche fallite`, failed);
}
```

## Collegamenti

- Per il pattern Circuit Breaker (utile quando i timeout diventano frequenti verso un servizio esterno), vedi la sezione "Pattern Universali" in `SKILL.md`.
- Per gli errori tipizzati usati negli esempi sopra (`NetworkError`), vedi `exception-hierarchy-design.md`.

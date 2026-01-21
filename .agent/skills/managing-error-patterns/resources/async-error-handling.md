# Gestione degli Errori Asincroni

Gestire i fallimenti nel codice concorrente e asincrono.

## Punti chiave

- **Promise Rejection**: Assicurati che ogni Promise abbia un `.catch()` o sia all'interno di un `try-catch` con `await`.
- **Unhandled Rejection**: Configura gestori globali per catturare errori dimenticati.
- **Race Conditions**: Gestisci errori che possono verificarsi durante le operazioni concorrenti.
- **Timeout**: Usa sempre timeout per le chiamate asincrone per evitare blocchi infiniti.

# Progettazione delle Gerarchie di Eccezioni

Una buona gerarchia di eccezioni aiuta a catturare gli errori al giusto livello di astrazione.

## Linee Guida

1. **Eccezione Base**: Crea sempre una classe base per la tua applicazione (es. `AppError`).
2. **Categorie Principali**: Suddividi in categorie come `ValidationError`, `NetworkError`, `DatabaseError`.
3. **Metadati**: Includi codici di errore e dettagli per rendere l'eccezione informativa.
4. **Tracciabilità**: Assicurati che lo stack trace sia preservato se stai incapsulando un'eccezione di basso livello.

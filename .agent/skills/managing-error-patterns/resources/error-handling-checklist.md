# Checklist Revisione Gestione Errori

Usa questa checklist durante le code review per assicurarti che la gestione degli errori sia robusta.

- [ ] L'input è validato all'inizio della funzione?
- [ ] Vengono usate eccezioni personalizzate invece di quelle generiche?
- [ ] Il contesto dell'errore (metadati, codici) è incluso?
- [ ] Le risorse (file, connessioni) vengono chiuse correttamente (try-finally, context manager)?
- [ ] Gli errori non vengono ignorati in silenzio?
- [ ] I messaggi di errore sono utili per l'utente/sviluppatore?
- [ ] Il logging è appropriato (non ridondante, livello corretto)?
- [ ] In caso di errore nel codice asincrono, la Promise viene rigettata correttamente?

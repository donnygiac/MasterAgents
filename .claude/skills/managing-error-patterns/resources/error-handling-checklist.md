# Checklist Revisione Gestione Errori

Usa questa checklist durante le code review per assicurarti che la gestione degli errori sia robusta.

- [ ] L'input è validato all'inizio della funzione?
- [ ] Vengono usate le eccezioni tipizzate del progetto (`AppError` e sottoclassi — vedi `exception-hierarchy-design.md`) invece di `Error` generico o stringhe?
- [ ] Il contesto dell'errore (`code`, `details`) è incluso e coerente con la gerarchia documentata?
- [ ] Le risorse (connessioni Prisma, file, socket) vengono chiuse correttamente (`try/finally`)?
- [ ] Gli errori non vengono ignorati in silenzio (nessun `catch` vuoto)?
- [ ] I messaggi di errore sono utili per l'utente/sviluppatore (vedi `error-message-guide.md`)?
- [ ] Il logging è appropriato (non ridondante, livello corretto, no doppio log+rilancio)?
- [ ] In caso di errore nel codice asincrono, la Promise viene rigettata correttamente e gestita (vedi `async-error-handling.md`)?
- [ ] Se l'errore è un `NetworkError` o `DatabaseError` transitorio, è stata applicata una strategia di recupero (vedi `error-recovery-strategies.md`) invece di propagarlo direttamente all'utente?

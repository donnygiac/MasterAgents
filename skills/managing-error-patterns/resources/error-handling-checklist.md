# Checklist Revisione Gestione Errori

Usa questa checklist durante le code review per assicurarti che la gestione degli errori sia robusta.

- [ ] L'input è validato al boundary (middleware Zod) e il dato parsato arriva al controller?
- [ ] Vengono usate le eccezioni tipizzate del progetto (classe base e sottoclassi — vedi la tabella "Gerarchia del progetto" in `SKILL.md`) invece di `Error` generico o stringhe?
- [ ] Il contesto dell'errore (`code`, `details`) è incluso e coerente con la gerarchia documentata?
- [ ] Le risorse (connessioni ORM, file, socket) vengono chiuse correttamente (`try/finally`)?
- [ ] Gli errori non vengono ignorati in silenzio (nessun `catch` vuoto)?
- [ ] I messaggi di errore sono utili per l'utente/sviluppatore (vedi `error-message-guide.md`)?
- [ ] Il logging è appropriato (non ridondante, livello corretto, no doppio log+rilancio)?
- [ ] In caso di errore nel codice asincrono, la Promise viene rigettata correttamente e gestita (vedi `async-error-handling.md`)?
- [ ] Se l'errore verso un servizio esterno o il DB è transitorio, è stata applicata una strategia di recupero (vedi `error-recovery-strategies.md`) invece di propagarlo direttamente all'utente?
- [ ] I nuovi `code` sono nella tabella di `SKILL.md` e nessun `code` esistente è stato rinominato?

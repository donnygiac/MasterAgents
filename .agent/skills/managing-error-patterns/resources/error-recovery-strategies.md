# Strategie di Recupero dagli Errori

Come recuperare correttamente quando qualcosa va storto.

## Strategie

- **Retry**: Riprova l'operazione (usa backoff esponenziale per servizi esterni).
- **Fallback**: Usa un valore predefinito o una cache se il servizio primario fallisce.
- **Failover**: Passa a un'istanza o un database secondario.
- **Queueing**: Salva l'operazione in una coda per rielaborarla più tardi.
- **User Intervention**: Chiedi all'utente di correggere l'input o riprovare manualmente.

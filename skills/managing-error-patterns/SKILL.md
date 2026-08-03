---
name: managing-error-patterns
description: Fonte di verità per la gestione errori del progetto - gerarchia di eccezioni tipizzate, contratto di risposta dell'error handler, codici applicativi, retry e circuit breaker per le integrazioni esterne. Usare quando si implementa o modifica gestione errori, si progettano API o si migliora la resilienza.
---

# Pattern di Gestione degli Errori (Node.js / TypeScript)

## Quando usare questa skill

- Implementazione della gestione degli errori in nuove funzionalità.
- Progettazione di API Express resilienti agli errori.
- Aggiunta o modifica di codici errore applicativi.
- Resilienza verso le integrazioni esterne: retry, circuit breaker, fallback.
- Gestione di errori asincroni/concorrenti (vedi `resources/async-error-handling.md`).
- Scrittura di messaggi di errore per l'utente (vedi `resources/error-message-guide.md`).

> Quando questa skill è usata insieme ad `architecture-analysis`, ogni endpoint documentato deve
> includere la tabella errori (HTTP code ↔ codice applicativo) usando la gerarchia reale del
> progetto come fonte per quei codici.

## Fonte di verità: il codice, non questa skill

La gerarchia autorevole vive nel modulo errori del progetto. **Al bootstrap del kit (o alla
prima invocazione) individuala e mappala qui:**

1. Dal backend: `codegraph query "AppError"` (poi prova `ApplicationError`, `HttpError`,
   `errorHandler`) per trovare classe base e middleware handler.
2. Leggi i due file e compila la tabella sotto con le sottoclassi REALI (nome, firma esatta del
   costruttore, HTTP status, `code`).
3. Documenta il contratto di risposta JSON serializzato dall'handler.
4. Se il progetto **non ha** ancora un modulo errori, proponi la gerarchia di riferimento in
   `resources/exception-hierarchy-design.md` come nuovo file (non applicarla senza conferma).

**Regola permanente**: leggi il modulo errori reale prima di scrivere codice; se skill e codice
divergono, vince il codice — e aggiorna questa tabella nello stesso commit.

### Gerarchia del progetto

<DA-COMPILARE al bootstrap: tabella "Classe | Firma | HTTP | code" dal modulo errori reale, +
percorso del file. Finché non è compilata, NON dare per buona la gerarchia di riferimento: è
solo una proposta per progetti greenfield.>

### Contratto di risposta

<DA-COMPILARE al bootstrap: forma JSON serializzata dall'error handler reale (es.
`{ "status": "error", "code": ..., "message": ..., "details"? }`), gestione degli errori ORM
noti (es. vincolo unico → 409), comportamento in produzione vs development.>

**CodeGraph obbligatorio**:
- Prima di toccare gerarchia o handler: `codegraph impact <ClasseBase>` e
  `codegraph callers <errorHandler>` — elenca i chiamanti impattati.
- Prima di inventare un nuovo codice errore: `codegraph query <NomeErrore>` per verificare che
  non esista già una sottoclasse adatta.

## Regole ferree (indipendenti dal progetto)

1. Mai `res.status().json()` per un errore nei controller: lancia e lascia fare all'handler.
2. Mai `throw new Error(...)`: diventa un 500 anonimo. Sempre sottoclassi tipizzate.
3. Gli errori di forma delle richieste li produce il middleware di validazione Zod come errore
   di validazione con `details`: non rivalidare a mano nel controller.
4. `code` è stabile: il frontend ci ramifica sopra, cambiarne uno esistente è un breaking change.
5. Nuova sottoclasse ⇒ verifica che l'handler ne serializzi i campi extra, e commenta il *perché*
   della sua esistenza.

## Resilienza delle integrazioni esterne

I client dei servizi esterni vivono in `src/lib/clients/` (o equivalente): la strategia di
resilienza si implementa lì, non sparsa nei service.

### Circuit Breaker

Previene fallimenti a cascata quando un servizio esterno è giù. Prima di implementarne uno
nuovo, verifica con `codegraph callees <metodoClient>` come il client gestisce già i fallimenti.

```typescript
enum CircuitState { CLOSED, OPEN, HALF_OPEN }

class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state = CircuitState.CLOSED;
  private lastFailureTime = 0;

  constructor(
    private failureThreshold = 5,
    private timeoutMs = 60_000,
    private successThreshold = 2,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        // Usa la classe di errore "servizio esterno non disponibile" del progetto (503)
        throw new ServiceUnavailableErrorDelProgetto();
      }
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (e) {
      this.onFailure();
      throw e;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) this.state = CircuitState.CLOSED;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) this.state = CircuitState.OPEN;
  }
}
```

### Degradazione aggraziata

```typescript
async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (e) {
    console.error('Funzione primaria fallita:', e);
    return fallback();
  }
}
```

Per retry con backoff, fallback multipli e queueing: `resources/error-recovery-strategies.md`.

## Best Practice

1. **Fail Fast**: valida l'input al boundary (middleware Zod), fallisci subito.
2. **Gestisci al livello giusto**: il service lancia errori di dominio; il controller non fa
   catch se non per tradurre; l'handler serializza. Mai catch vuoti.
3. **Loggare o rilanciare, mai entrambi**: log-and-rethrow duplica le voci di log.
4. **Fallimento atteso ≠ errore**: la validazione respinta non deve inondare i log.
5. **Messaggi utili**: cosa è successo e come rimediare — mai la risposta grezza del fornitore
   esterno nel `message` utente (va nei log). Vedi `resources/error-message-guide.md`.
6. **Errori type-safe**: sempre sottoclassi della classe base, mai stringhe od oggetti generici.

## Trappole comuni

- `catch (e: any)` senza discriminare il tipo: nasconde i bug.
- Ricalcolare a mano nel controller ciò che il middleware di validazione ha già validato.
- Nuova sottoclasse senza controllare cosa serializza davvero l'handler.
- Codice errore inventato al volo invece di riusare quelli della tabella del progetto.
- Copiare in questa skill esempi con firme diverse da quelle reali: la tabella sopra è l'unico
  posto autorizzato a descrivere la gerarchia, e si aggiorna insieme al codice.

## Handoff

- **Input atteso**: design doc di `brainstorming` con la sezione "Errori previsti" (codici dalla
  tabella del progetto), oppure un task diretto di resilienza/bugfix.
- **Output prodotto**: sottoclassi nel modulo errori + uso nei service/controller; se il
  contratto di un endpoint cambia, la tabella errori va riportata nel design doc in `docs/plans/`.
- **Prossima skill**: i messaggi rivolti all'utente seguono
  [`../maintaining-brand-identity/resources/voice-tone.md`](../maintaining-brand-identity/resources/voice-tone.md);
  se l'intervento modifica integrazioni o schema, aggiorna la documentazione con
  `architecture-analysis`.

## Risorse

- **[`resources/exception-hierarchy-design.md`](resources/exception-hierarchy-design.md)**: gerarchia di riferimento per progetti greenfield + criteri per estenderla.
- **[`resources/error-recovery-strategies.md`](resources/error-recovery-strategies.md)**: retry, fallback, queueing.
- **[`resources/async-error-handling.md`](resources/async-error-handling.md)**: Promise, unhandled rejection, concorrenza.
- **[`resources/error-handling-checklist.md`](resources/error-handling-checklist.md)**: checklist di review.
- **[`resources/error-message-guide.md`](resources/error-message-guide.md)**: messaggi di errore utili.
- **[`scripts/error-analyzer.py`](scripts/error-analyzer.py)**: analizza i pattern di errore nei log (`--known-codes` per i codici del progetto).

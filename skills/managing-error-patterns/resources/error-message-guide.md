# Guida ai Messaggi di Errore

Come scrivere messaggi che aiutino davvero a risolvere il problema.

## Principi

1. **Sii Chiaro**: Spiega cosa è successo senza usare troppo gergo.
2. **Sii Utile**: Suggerisci come l'utente o lo sviluppatore può risolvere il problema.
3. **Fornisci Contesto**: Includi ID, nomi di file o parametri che hanno causato l'errore — nei
   `details`, non nel testo del messaggio (vedi `exception-hierarchy-design.md`).
4. **Sii Educato**: Evita termini incolpatori o eccessivamente allarmisti. Segui il tono di voce
   definito in [`../../maintaining-brand-identity/resources/voice-tone.md`](../../maintaining-brand-identity/resources/voice-tone.md).

## Esempi

- **Pessimo**: "Errore di sistema."
- **Sufficiente**: "Impossibile salvare il file."
- **Ottimo**: "Impossibile salvare il file 'report.pdf' perché il disco è pieno. Libera spazio e riprova."

## Due destinatari, due messaggi

Ogni errore ne ha due, e non vanno confusi:

| | Destinatario | Dove vive | Regola |
|---|---|---|---|
| `message` | Utente finale | Risposta HTTP | Nella lingua del prodotto, nessun dettaglio interno (query, stack, nomi di tabella, ID di sistemi esterni) |
| `code` | Client e sviluppatore | Risposta HTTP | `SCREAMING_SNAKE_CASE` stabile: il frontend ci ramifica sopra, cambiarlo è breaking |
| `details` | Client | Risposta HTTP | Solo per errori di forma: `{ "campo": ["cosa non torna"] }` |
| log | Sviluppatore | Server | Qui, e solo qui, vanno stack, payload e ID di correlazione |

## Applicazione

I messaggi si scrivono costruendo una sottoclasse della classe di errore del progetto (vedi
tabella "Gerarchia del progetto" in `SKILL.md`), mai concatenando stringhe in un
`res.status().json()`.

```ts
// ✗ Il messaggio non dice quale campo, e i dettagli Zod vengono buttati.
throw new AppError('Errore di validazione', 400, 'VALIDATION_ERROR');

// ✓ Il codice è stabile per il client, il messaggio è leggibile, i dettagli sono strutturati.
throw new ValidationError('Controlla i campi evidenziati', {
    taxCode: ['Il codice fiscale deve essere di 16 caratteri'],
});

// ✓ Se NotFoundError compone da sé il messaggio, passa il nome della risorsa, non la frase.
throw new NotFoundError('Ordine');
```

Per gli errori che nascono da un'integrazione esterna, il messaggio utente non deve mai esporre
la risposta del fornitore: riassumi l'effetto ("Non è stato possibile sincronizzare l'ordine,
riprova tra qualche minuto") e logga la risposta grezza. Vedi `error-recovery-strategies.md`
per decidere se l'errore è ritentabile.

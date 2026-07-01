# Database Modification: Payment Methods & Offer Details

## Step 0 — Context Snapshot
- **Domain**: Gestione vendite e pagamenti tramite portale agenti.
- **Goal**: Tracciare le modalità di pagamento e i dettagli aggiuntivi delle offerte (allegati e info pagamenti).
- **Queries**:
    - Recupero dettagli offerta con associazione al metodo di pagamento.
    - Validazione dei dettagli di pagamento in base al metodo scelto.

## Step 1 — Conceptual Model
- **Relationship**: `Offer` (1:1) `OfferDetail`.
- **Relationship**: `PaymentMethod` (1:N) `OfferDetail`.
- **Categorization**: 
    - `payment_methods`: Master/Lookup table.
    - `offer_details`: State/Entity extension.

## Step 2 — Logical Model
- `payment_methods`: `id`, `name`.
- `offer_details`: `id`, `offer_id`, `attachments`, `payment_method_id`, `payment_details`.

## Step 3 — Physical Model (MySQL/Prisma)
- `payment_methods`:
    - `id`: `BigInt @id @default(autoincrement()) @db.UnsignedBigInt`
    - `name`: `String @unique @db.VarChar(50)`
- `offer_details`:
    - `id`: `BigInt @id @default(autoincrement()) @db.UnsignedBigInt`
    - `offerId`: `BigInt @unique @map("offer_id") @db.UnsignedBigInt`
    - `attachments`: `Json?` (Array of strings/objects)
    - `paymentMethodId`: `BigInt @map("payment_method_id") @db.UnsignedBigInt`
    - `paymentDetails`: `Json?` (Dynamic info per payment method)
    - `createdAt`, `updatedAt`: Standard audit columns.

## Dynamic Payment Info Reasoning
Ho scelto la soluzione **JSON column (`payment_details`)** rispetto ad altre alternative:
- **VS "N attributi NULL"**: Il JSON evita tabelle sbilanciate e pesanti da manutenere se si aggiungono metodi in futuro.
- **VS "Tabelle Specializzate"**: Evita join complessi e overhead di schema per dati che sono tipicamente piccoli (es. IBAN, Numero assegno).
- **Validation**: La validazione verrà fatta nello strato applicativo tramite **Zod**, definendo parametri specifici per ogni `payment_method_id`.

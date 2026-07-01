# Database Design: Sales Portal (Webidoo)

## Step 0 — Context Snapshot

### Dominio Applicativo
Portale per agenti di vendita per la gestione di un catalogo prodotti/servizi e la generazione di offerte multi-step con integrazione di firma digitale.

### Attori Principali
1. **Agenti**: Creano offerte, gestiscono il catalogo (se autorizzati).
2. **Clienti**: Ricevono offerte e firmano i contratti.
3. **Admin**: Caricano prodotti nel catalogo, gestiscono gli utenti.

### Volumi Stimati
- **Prodotti/Servizi**: 100-1000 righe.
- **Offerte**: 50-200 offerte al giorno per l'intera organizzazione.
- **Crescita**: Stimata in 20.000 - 50.000 offerte/anno.

### Query principali (Top 10 Query Paths)
1. Recupero catalogo prodotti per categoria/tipo.
2. Ricerca prodotto per nome/ID.
3. Creazione testata offerta (Draft).
4. Aggiunta item a un'offerta.
5. Visualizzazione riepilogo offerta (JOIN `Offer` + `OfferItem` + `Product`).
6. Aggiornamento stato offerta (IN_ATTESA_FIRMA, FIRMATO).
7. Listato offerte per Agente (filtro per `agent_id`).
8. Recupero dettagli offerta per invio a servizio firma.
9. Audit log delle operazioni su offerte (opzionale).
10. Verifica utente autorizzato (Google Auth domain check).

---

## Step 1 — Conceptual Model

### Entità e Relazioni
- **User** (Agent/Admin): 1 a N con **Offer**.
- **Product**: 1 a N con **OfferItem**.
- **Offer**: 1 a N con **OfferItem** (Composizione).
- **OfferItem**: Tabella di collegamento tra **Offer** e **Product**.
- **OfferStatusHistory**: Log dei passaggi di stato per ogni offerta.

---

## Step 2 — Logical Model (3NF)

### [User]
- `id` (PK)
- `email` (Unique)
- `name`
- `role` (ADMIN, AGENT)
- `created_at`
- `updated_at`

### [Product]
- `id` (PK)
- `name`
- `description`
- `price`
- `type` (PRODUCT, SERVICE)
- `image_url`
- `is_active` (per soft delete logico nel catalogo)

### [Offer]
- `id` (PK)
- `agent_id` (FK -> User.id)
- `customer_name`
- `customer_email`
- `customer_vat` (IVA/Codice Fiscale)
- `status` (DRAFT, PENDING_SIGNATURE, SIGNED, REJECTED)
- `total_amount`
- `envelope_id` (ID restituito dal microservizio di firma)
- `signed_at`
- `created_at`
- `updated_at`

### [OfferItem]
- `id` (PK)
- `offer_id` (FK -> Offer.id)
- `product_id` (FK -> Product.id)
- `quantity`
- `unit_price` (Prezzo snapshot al momento dell'offerta)
- `discount`

---

## Step 3 — Physical Model (MySQL-specific)

```sql
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'AGENT') NOT NULL DEFAULT 'AGENT',
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(12, 2) NOT NULL,
  `type` ENUM('PRODUCT', 'SERVICE') NOT NULL DEFAULT 'PRODUCT',
  `image_url` VARCHAR(512),
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `offers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `agent_id` BIGINT UNSIGNED NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_vat` VARCHAR(50),
  `status` ENUM('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `envelope_id` VARCHAR(255),
  `signed_at` DATETIME(6) NULL,
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT `fk_offers_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `offer_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `offer_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12, 2) NOT NULL,
  `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_items_offer` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Step 4 — Index Strategy

| Query Path | Target Table | Proposed Index | Reason |
| :--- | :--- | :--- | :--- |
| Ricerca Prodotti Attivi | `products` | `idx_active_type` (`is_active`, `type`) | Filtro per catalogo pubblico. |
| Offerte per Agente | `offers` | `idx_agent_status` (`agent_id`, `status`) | Dashboard agente con filtri stato. |
| Ricerca Offerta per Firma | `offers` | `idx_envelope` (`envelope_id`) | Chiamata di callback dal container signature. |
| Integrità Email | `users` | (UNIQUE su `email`) | Già presente come PK/Unique. |
| Lookup Item Offerta | `offer_items` | `idx_offer_id` (`offer_id`) | JOIN per recupero righe documento. |

```sql
ALTER TABLE `products` ADD INDEX `idx_active_type` (`is_active`, `type`);
ALTER TABLE `offers` ADD INDEX `idx_agent_status` (`agent_id`, `status`);
ALTER TABLE `offers` ADD INDEX `idx_envelope` (`envelope_id`);
```

---

## Step 5 — Integrity & Lifecycle

### Soft Delete
- **Prodotti**: Usiamo `is_active` (BOOLEAN). Se un prodotto viene rimosso dal catalogo, non deve rompere le offerte storiche che puntano ad esso.
- **Offerte**: Non si cancellano mai fisicamente. Usiamo lo stato `REJECTED` o `CANCELLED`.

### Audit
- Ogni tabella ha `created_at` e `updated_at`.
- `offers` tiene traccia dell'agente che l'ha creata via `agent_id`.

### Gestione Concorrenza
- **Unique Constraint** su `users.email` per evitare duplicati in fase di login Google.
- **Foreign Key RESTRICT** su `offers.agent_id` per impedire la cancellazione di un agente che ha offerte attive.

---

## Step 6 — Growth Plan

### Partizionamento
- **Offerte**: Dato il volume stimato (50k/anno), non è necessario il partizionamento immediato. Tuttavia, in futuro si potrebbe partizionare la tabella `offers` per `RANGE` sull'anno di `created_at`.

### Archiviazione
- Le offerte "Signed" vecchie di più di 2 anni possono essere spostate in una tabella `offers_archive` per mantenere la tabella principale snella.

---

## Step 7 — Final Proposal Package

### Schema Finale (DDL)

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'AGENT') NOT NULL DEFAULT 'AGENT',
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for products
-- ----------------------------
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(12, 2) NOT NULL,
  `type` ENUM('PRODUCT', 'SERVICE') NOT NULL DEFAULT 'PRODUCT',
  `image_url` VARCHAR(512),
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `idx_active_type` (`is_active`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for offers
-- ----------------------------
CREATE TABLE `offers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `agent_id` BIGINT UNSIGNED NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_vat` VARCHAR(50),
  `status` ENUM('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `envelope_id` VARCHAR(255),
  `signed_at` DATETIME(6) NULL,
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT `fk_offers_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_agent_status` (`agent_id`, `status`),
  INDEX `idx_envelope` (`envelope_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for offer_items
-- ----------------------------
CREATE TABLE `offer_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `offer_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12, 2) NOT NULL,
  `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_items_offer` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX `idx_offer_id` (`offer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
```

### Checklist di Review
- [x] PK BIGINT UNSIGNED auto-increment.
- [x] FK con nomi espliciti e vincoli di cancellazione corretti.
- [x] DECIMAL(12,2) per valuta.
- [x] DATETIME(6) per timestamp.
- [x] Indici composti per query frequenti.
- [x] Charset utf8mb4.

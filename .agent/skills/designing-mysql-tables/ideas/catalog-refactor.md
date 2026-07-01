# Design Log: Dynamic Catalog Refactor

## Context Snapshot
- **Domain**: Catalog management for agents.
- **Requirements**: Table `catalogues` with `id`, `name`, `max_deposit`.
- **Integrity**: `products` must link to `catalogues`.

## Step 1 — Conceptual Model
- **Catalog** (1) ---- (N) **Product**
- Ownership: Catalogs are system entities.
- Lifecycle: Hard delete not recommended if products exist.

## Step 2 — Logical Model (3NF)
- `catalogues` (id, name, max_deposit)
- `products` (..., catalog_id FK catalogues.id)

## Step 3 — Physical Model (MySQL-specific)
```prisma
model Catalog {
  id          BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  name        String
  maxDeposit  Decimal   @db.Decimal(5, 2) @map("max_deposit")
  products    Product[]
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @default(now()) @updatedAt @map("updated_at")

  @@map("catalogues")
}

// In Product model:
// catalogFamily Int   (Existing)
// We will replace catalystFamily with catalogId relation
```

## Step 4 — Index Strategy
- Index on `products.catalog_id` (standard for FK).
- Index on `catalogues.name` if search is required.

## Step 5 — Integrity & Lifecycle
- Seeding with:
    1. Webidoo (id 1, deposit 20)
    2. Alibaba (id 2, deposit 20)
    3. Grenke (id 3, deposit 6.76)
- Foreign key constraint to prevent orphan products.

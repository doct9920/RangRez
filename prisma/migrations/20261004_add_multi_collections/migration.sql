-- Create collections table
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "collections_name_key" ON "collections"("name");
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");
CREATE INDEX "collections_name_idx" ON "collections"("name");
CREATE INDEX "collections_slug_idx" ON "collections"("slug");

-- Create product ? collection table
CREATE TABLE "product_collections" (
    "product_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_collections_pkey"
        PRIMARY KEY ("product_id", "collection_id")
);

CREATE INDEX "product_collections_collection_id_idx"
    ON "product_collections"("collection_id");

-- Copy existing collection names into the new collections table
INSERT INTO "collections" ("id", "name", "slug", "updated_at")
SELECT
    'collection_' || md5(collection),
    collection,
    lower(
        regexp_replace(
            regexp_replace(trim(collection), '[^a-zA-Z0-9]+', '-', 'g'),
            '(^-|-$)',
            '',
            'g'
        )
    ),
    CURRENT_TIMESTAMP
FROM "products"
GROUP BY collection;

-- Link every existing product to its current collection
INSERT INTO "product_collections" ("product_id", "collection_id")
SELECT
    p."id",
    c."id"
FROM "products" p
JOIN "collections" c
    ON c."name" = p."collection";

-- Add foreign keys
ALTER TABLE "product_collections"
ADD CONSTRAINT "product_collections_product_id_fkey"
FOREIGN KEY ("product_id")
REFERENCES "products"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "product_collections"
ADD CONSTRAINT "product_collections_collection_id_fkey"
FOREIGN KEY ("collection_id")
REFERENCES "collections"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
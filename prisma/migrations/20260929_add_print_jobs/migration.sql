CREATE TYPE "PrintJobStatus" AS ENUM (
    'pending',
    'printing',
    'printed',
    'failed'
);

CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "printed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "print_jobs_order_id_key"
ON "print_jobs"("order_id");

CREATE INDEX "print_jobs_status_idx"
ON "print_jobs"("status");

CREATE INDEX "print_jobs_created_at_idx"
ON "print_jobs"("created_at");

ALTER TABLE "print_jobs"
ADD CONSTRAINT "print_jobs_order_id_fkey"
FOREIGN KEY ("order_id")
REFERENCES "orders"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
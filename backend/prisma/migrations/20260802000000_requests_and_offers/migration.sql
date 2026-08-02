-- Oglasna tabla: zahtjevi narucilaca (usluga ili kupovina) + ponude majstora

-- AlterEnum: slike se sada mogu vezati i za zahtjev
ALTER TYPE "ImageEntityType" ADD VALUE 'REQUEST';

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('SERVICE', 'PURCHASE');
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateTable: requests
CREATE TABLE "requests" (
    "id" SERIAL NOT NULL,
    "author_id" UUID NOT NULL,
    "type" "RequestType" NOT NULL DEFAULT 'SERVICE',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" INTEGER,
    "city" TEXT NOT NULL,
    "municipality" TEXT,
    "budget_min" DECIMAL(10,2),
    "budget_max" DECIMAL(10,2),
    "deadline" DATE,
    "contact_phone" TEXT,
    "contact_visible" BOOLEAN NOT NULL DEFAULT true,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "offer_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "requests_status_created_at_idx" ON "requests"("status", "created_at");
CREATE INDEX "requests_city_idx" ON "requests"("city");

-- Fuzzy pretraga naslova zahtjeva (ILIKE %...% preko trigram indeksa)
CREATE INDEX "requests_title_trgm_idx" ON "requests" USING GIN ("title" gin_trgm_ops);

-- CreateTable: request_labels
CREATE TABLE "request_labels" (
    "request_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,
    CONSTRAINT "request_labels_pkey" PRIMARY KEY ("request_id", "label_id")
);

-- CreateTable: offers
CREATE TABLE "offers" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "provider_id" UUID NOT NULL,
    "price" DECIMAL(10,2),
    "message" TEXT NOT NULL,
    "days_to_done" INTEGER,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "offers_request_id_provider_id_key" ON "offers"("request_id", "provider_id");

-- AlterTable: images dobija vezu ka zahtjevu
ALTER TABLE "images" ADD COLUMN "request_id" INTEGER;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "requests" ADD CONSTRAINT "requests_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "request_labels" ADD CONSTRAINT "request_labels_request_id_fkey"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "request_labels" ADD CONSTRAINT "request_labels_label_id_fkey"
    FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offers" ADD CONSTRAINT "offers_request_id_fkey"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offers" ADD CONSTRAINT "offers_provider_id_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "images" ADD CONSTRAINT "images_request_id_fkey"
    FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

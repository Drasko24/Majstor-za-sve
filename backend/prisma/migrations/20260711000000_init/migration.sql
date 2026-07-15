-- Enable pg_trgm for fuzzy label search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GUEST', 'PROVIDER', 'CLIENT', 'ADMIN');
CREATE TYPE "LabelStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');
CREATE TYPE "ModerationAction" AS ENUM ('APPROVED', 'REJECTED', 'MERGED');
CREATE TYPE "ImageEntityType" AS ENUM ('PROVIDER_GALLERY', 'PORTFOLIO');

-- CreateTable: users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable: provider_profiles
CREATE TABLE "provider_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "years_experience" INTEGER,
    "city" TEXT NOT NULL,
    "municipality" TEXT,
    "phone" TEXT,
    "phone_visible" BOOLEAN NOT NULL DEFAULT false,
    "email_visible" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "avg_rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_profiles_user_id_key" ON "provider_profiles"("user_id");

-- CreateTable: categories
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateTable: labels
CREATE TABLE "labels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "status" "LabelStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "labels_slug_key" ON "labels"("slug");
-- GIN index for pg_trgm fuzzy search on label name
CREATE INDEX "labels_name_trgm_idx" ON "labels" USING GIN ("name" gin_trgm_ops);

-- CreateTable: provider_labels
CREATE TABLE "provider_labels" (
    "provider_id" UUID NOT NULL,
    "label_id" INTEGER NOT NULL,
    CONSTRAINT "provider_labels_pkey" PRIMARY KEY ("provider_id","label_id")
);

-- CreateTable: portfolio_items
CREATE TABLE "portfolio_items" (
    "id" SERIAL NOT NULL,
    "provider_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: images
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "entity_type" "ImageEntityType" NOT NULL,
    "provider_id" UUID,
    "portfolio_id" INTEGER,
    "url" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "file_size" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable: reviews
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "provider_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX "reviews_provider_id_client_id_key" ON "reviews"("provider_id", "client_id");

-- CreateTable: label_moderation_log
CREATE TABLE "label_moderation_log" (
    "id" SERIAL NOT NULL,
    "label_id" INTEGER NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "merged_with_label_id" INTEGER,
    "note" TEXT,
    "decided_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "label_moderation_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey constraints
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "labels" ADD CONSTRAINT "labels_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "labels" ADD CONSTRAINT "labels_requested_by_fkey"
    FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "provider_labels" ADD CONSTRAINT "provider_labels_provider_id_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "provider_labels" ADD CONSTRAINT "provider_labels_label_id_fkey"
    FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_provider_id_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "images" ADD CONSTRAINT "images_provider_id_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "images" ADD CONSTRAINT "images_portfolio_id_fkey"
    FOREIGN KEY ("portfolio_id") REFERENCES "portfolio_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "label_moderation_log" ADD CONSTRAINT "label_moderation_log_label_id_fkey"
    FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "label_moderation_log" ADD CONSTRAINT "label_moderation_log_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "label_moderation_log" ADD CONSTRAINT "label_moderation_log_merged_with_label_id_fkey"
    FOREIGN KEY ("merged_with_label_id") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

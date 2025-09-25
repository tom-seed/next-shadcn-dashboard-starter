-- Create enum for client membership roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientRole') THEN
    CREATE TYPE "ClientRole" AS ENUM ('INTERNAL_ADMIN', 'CLIENT_ADMIN', 'CLIENT_MEMBER');
  END IF;
END
$$;

-- Add Clerk organization linkage to clients
ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "clerkOrganizationId" TEXT;

-- Ensure organization IDs stay unique when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Client_clerkOrganizationId_key'
  ) THEN
    CREATE UNIQUE INDEX "Client_clerkOrganizationId_key"
      ON "Client"("clerkOrganizationId")
      WHERE "clerkOrganizationId" IS NOT NULL;
  END IF;
END
$$;

-- Create client membership table if it does not exist
CREATE TABLE IF NOT EXISTS "ClientMembership" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL,
  "clerkUserId" TEXT NOT NULL,
  "role" "ClientRole" NOT NULL DEFAULT 'CLIENT_MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints and indexes for the membership table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ClientMembership_clientId_fkey'
  ) THEN
    ALTER TABLE "ClientMembership"
      ADD CONSTRAINT "ClientMembership_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'ClientMembership_clerkUserId_idx'
  ) THEN
    CREATE INDEX "ClientMembership_clerkUserId_idx"
      ON "ClientMembership"("clerkUserId");
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'ClientMembership_clientId_clerkUserId_key'
  ) THEN
    CREATE UNIQUE INDEX "ClientMembership_clientId_clerkUserId_key"
      ON "ClientMembership"("clientId", "clerkUserId");
  END IF;
END
$$;

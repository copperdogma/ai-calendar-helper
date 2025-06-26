CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable for CalendarSyncState
CREATE TABLE "CalendarSyncState" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4()::text),
  "userId" TEXT NOT NULL,
  "calendarId" TEXT NOT NULL,
  "syncToken" TEXT,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CalendarSyncState_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CalendarSyncState" ADD CONSTRAINT "CalendarSyncState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "CalendarSyncState_userId_calendarId_key" ON "CalendarSyncState"("userId", "calendarId");

-- CreateTable for UserSettings
CREATE TABLE "UserSettings" (
  "id" TEXT NOT NULL DEFAULT (uuid_generate_v4()::text),
  "userId" TEXT NOT NULL UNIQUE,
  "lookAheadDays" INTEGER NOT NULL DEFAULT 14,
  "noveltyThreshold" DECIMAL NOT NULL DEFAULT 0.2,
  "autoBlacklist" BOOLEAN NOT NULL DEFAULT TRUE,
  "blacklist" JSONB,
  "whitelist" JSONB,
  "storePattern" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId"); 
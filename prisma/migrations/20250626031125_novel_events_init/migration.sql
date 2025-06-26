/*
  Warnings:

  - You are about to alter the column `noveltyThreshold` on the `UserSettings` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- DropForeignKey
ALTER TABLE "CalendarSyncState" DROP CONSTRAINT "CalendarSyncState_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_userId_fkey";

-- AlterTable
ALTER TABLE "CalendarSyncState" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "noveltyThreshold" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CalendarSyncState_userId_idx" ON "CalendarSyncState"("userId");

-- AddForeignKey
ALTER TABLE "CalendarSyncState" ADD CONSTRAINT "CalendarSyncState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

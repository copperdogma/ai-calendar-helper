-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('TEXT', 'IMAGE', 'TEXT+IMAGE');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP');

-- CreateEnum
CREATE TYPE "CalendarAction" AS ENUM ('GOOGLE', 'OUTLOOK', 'ICS');

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "inputType" "InputType" NOT NULL,
    "textSizeChars" INTEGER,
    "imageSizeBytes" INTEGER,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "parseTimeMs" INTEGER,
    "eventsExtracted" INTEGER,
    "parseSuccess" BOOLEAN,
    "errorReason" TEXT,
    "deviceType" "DeviceType" NOT NULL,
    "os" TEXT,
    "browser" TEXT,
    "locale" TEXT,
    "calendarAction" "CalendarAction",

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageEvent_createdAt_idx" ON "UsageEvent"("createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_idx" ON "UsageEvent"("userId");

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

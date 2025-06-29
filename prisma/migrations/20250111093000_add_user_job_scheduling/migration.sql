-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('NOVEL_EVENTS');

-- CreateEnum
CREATE TYPE "SchedulePreset" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "UserJobSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "schedule" "SchedulePreset" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserJobSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobFailure" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "errorDetails" JSONB,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retriedAt" TIMESTAMP(3),
    "retriedBy" TEXT,

    CONSTRAINT "JobFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserJobSchedule_userId_jobType_key" ON "UserJobSchedule"("userId", "jobType");

-- CreateIndex
CREATE INDEX "UserJobSchedule_nextRun_idx" ON "UserJobSchedule"("nextRun");

-- CreateIndex
CREATE INDEX "UserJobSchedule_enabled_idx" ON "UserJobSchedule"("enabled");

-- CreateIndex
CREATE INDEX "JobFailure_userId_idx" ON "JobFailure"("userId");

-- CreateIndex
CREATE INDEX "JobFailure_failedAt_idx" ON "JobFailure"("failedAt");

-- AddForeignKey
ALTER TABLE "UserJobSchedule" ADD CONSTRAINT "UserJobSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobFailure" ADD CONSTRAINT "JobFailure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobFailure" ADD CONSTRAINT "JobFailure_retriedBy_fkey" FOREIGN KEY ("retriedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
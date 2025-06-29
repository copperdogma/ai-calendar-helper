-- Add schedule time fields to UserJobSchedule table
ALTER TABLE "UserJobSchedule" ADD COLUMN "scheduleTime" TEXT;
ALTER TABLE "UserJobSchedule" ADD COLUMN "scheduleDayOfWeek" INTEGER;
ALTER TABLE "UserJobSchedule" ADD COLUMN "scheduleDayOfMonth" INTEGER; 
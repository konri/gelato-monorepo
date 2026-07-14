-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locationPermission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationPermission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredCity" TEXT;

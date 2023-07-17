-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBiometricOn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pin" TEXT;

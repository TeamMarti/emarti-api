/*
  Warnings:

  - Added the required column `code` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gate` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "gate" TEXT NOT NULL;

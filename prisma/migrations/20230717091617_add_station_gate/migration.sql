/*
  Warnings:

  - Added the required column `checkInGateId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "checkInGateId" TEXT NOT NULL,
ADD COLUMN     "checkOutGateId" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_checkInGateId_fkey" FOREIGN KEY ("checkInGateId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_checkOutGateId_fkey" FOREIGN KEY ("checkOutGateId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Fare" (
    "id" TEXT NOT NULL,
    "startStationId" TEXT NOT NULL,
    "endStationId" TEXT NOT NULL,
    "fare" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Fare_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Fare" ADD CONSTRAINT "Fare_startStationId_fkey" FOREIGN KEY ("startStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fare" ADD CONSTRAINT "Fare_endStationId_fkey" FOREIGN KEY ("endStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "LogType" ADD VALUE 'BATTERY_DONE';

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "lastBatteryDate" TIMESTAMP(3),
ADD COLUMN     "lastBatteryKm" INTEGER,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "licensePlate" DROP NOT NULL,
ALTER COLUMN "lastServiceDate" DROP NOT NULL,
ALTER COLUMN "lastServiceKm" DROP NOT NULL,
ALTER COLUMN "currentKm" DROP NOT NULL,
ALTER COLUMN "serviceIntervalMonths" SET DEFAULT 6,
ALTER COLUMN "serviceIntervalKm" SET DEFAULT 10000,
ALTER COLUMN "nextTestDate" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CarTask" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CarTask" ADD CONSTRAINT "CarTask_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('TEST_30D', 'TEST_14D', 'TEST_OVERDUE', 'SERVICE_DATE_30D', 'SERVICE_DATE_14D', 'SERVICE_DATE_OVERDUE', 'SERVICE_KM_1000', 'SERVICE_KM_300');

-- CreateTable
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "lastServiceDate" TIMESTAMP(3) NOT NULL,
    "lastServiceKm" INTEGER NOT NULL,
    "currentKm" INTEGER NOT NULL,
    "serviceIntervalMonths" INTEGER NOT NULL,
    "serviceIntervalKm" INTEGER NOT NULL,
    "nextTestDate" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dashboard_token_key" ON "Dashboard"("token");

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

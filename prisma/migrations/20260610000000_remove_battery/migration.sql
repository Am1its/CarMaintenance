-- Delete any battery logs so the enum migration doesn't fail
DELETE FROM "ServiceLog" WHERE "type" = 'BATTERY_DONE';

-- Recreate LogType enum without BATTERY_DONE
CREATE TYPE "LogType_new" AS ENUM ('SERVICE_DONE', 'TEST_DONE');
ALTER TABLE "ServiceLog" ALTER COLUMN "type" TYPE "LogType_new" USING ("type"::text::"LogType_new");
DROP TYPE "LogType";
ALTER TYPE "LogType_new" RENAME TO "LogType";

-- Drop battery columns from Car
ALTER TABLE "Car" DROP COLUMN "trackBattery";
ALTER TABLE "Car" DROP COLUMN "lastBatteryDate";
ALTER TABLE "Car" DROP COLUMN "lastBatteryKm";

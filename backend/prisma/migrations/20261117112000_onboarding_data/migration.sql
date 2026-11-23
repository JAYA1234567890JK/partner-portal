ALTER TABLE "Property" ADD COLUMN "onboardingData" JSONB;
ALTER TABLE "Room" ADD COLUMN "roomDetails" JSONB;
ALTER TABLE "Partner" ADD COLUMN "businessType" TEXT;
ALTER TABLE "Partner" ADD COLUMN "city" TEXT;
ALTER TABLE "Partner" ADD COLUMN "state" TEXT;
ALTER TABLE "PropertyImage" ADD COLUMN "imageDetails" JSONB;
ALTER TABLE "RoomImage" ADD COLUMN "imageDetails" JSONB;

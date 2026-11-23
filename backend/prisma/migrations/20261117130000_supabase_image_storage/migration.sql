ALTER TABLE "PropertyImage" ADD COLUMN "storagePath" TEXT;
CREATE UNIQUE INDEX "PropertyImage_storagePath_key" ON "PropertyImage"("storagePath");

ALTER TABLE "RoomImage" ADD COLUMN "storagePath" TEXT;
ALTER TABLE "RoomImage" ADD COLUMN "isCover" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RoomImage" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Room';
CREATE UNIQUE INDEX "RoomImage_storagePath_key" ON "RoomImage"("storagePath");

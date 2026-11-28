ALTER TABLE "User" ADD COLUMN "adminId" TEXT;

CREATE UNIQUE INDEX "User_adminId_key" ON "User"("adminId");

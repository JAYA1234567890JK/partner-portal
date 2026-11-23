-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'PARTNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyApprovalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'UNDER_REVIEW', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RoomVerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "businessEmail" TEXT NOT NULL,
    "businessPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "approvalStatus" "PropertyApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "applicationReference" TEXT,
    "submittedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bedCount" INTEGER NOT NULL,
    "description" TEXT,
    "status" "RoomStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "verificationStatus" "RoomVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomImage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyPricing" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "HourlyPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");

-- CreateIndex
CREATE INDEX "Partner_businessEmail_idx" ON "Partner"("businessEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Property_applicationReference_key" ON "Property"("applicationReference");

-- CreateIndex
CREATE INDEX "Property_partnerId_approvalStatus_idx" ON "Property"("partnerId", "approvalStatus");

-- CreateIndex
CREATE INDEX "Property_city_state_idx" ON "Property"("city", "state");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_sortOrder_idx" ON "PropertyImage"("propertyId", "sortOrder");

-- CreateIndex
CREATE INDEX "Room_propertyId_status_idx" ON "Room"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Room_verificationStatus_idx" ON "Room"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Room_propertyId_roomNumber_key" ON "Room"("propertyId", "roomNumber");

-- CreateIndex
CREATE INDEX "RoomImage_roomId_sortOrder_idx" ON "RoomImage"("roomId", "sortOrder");

-- CreateIndex
CREATE INDEX "HourlyPricing_isActive_durationHours_idx" ON "HourlyPricing"("isActive", "durationHours");

-- CreateIndex
CREATE UNIQUE INDEX "HourlyPricing_roomId_durationHours_key" ON "HourlyPricing"("roomId", "durationHours");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomImage" ADD CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourlyPricing" ADD CONSTRAINT "HourlyPricing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

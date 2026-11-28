ALTER TABLE "Property"
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMPTZ(6),
ADD COLUMN "reviewedById" TEXT;

CREATE INDEX "Property_reviewedById_idx" ON "Property"("reviewedById");

ALTER TABLE "Property"
ADD CONSTRAINT "Property_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

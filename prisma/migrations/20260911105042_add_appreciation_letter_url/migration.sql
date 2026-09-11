-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestStatus" ADD VALUE 'SENATE_PROCESSING';
ALTER TYPE "RequestStatus" ADD VALUE 'AWAITING_DEPARTMENT_RESPONSE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'FACULTY_USER';
ALTER TYPE "Role" ADD VALUE 'CENTRAL_USER';

-- AlterTable
ALTER TABLE "GiftRequest" ADD COLUMN     "appreciationLetterUrl" TEXT,
ADD COLUMN     "decisionExtractUrl" TEXT,
ADD COLUMN     "departmentAttachment" TEXT,
ADD COLUMN     "departmentResponse" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "faculty" TEXT,
ADD COLUMN     "office" TEXT;

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "giftRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_giftRequestId_fkey" FOREIGN KEY ("giftRequestId") REFERENCES "GiftRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - The values [NEEDS_INFO] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'ADVANCEMENT_REVIEW', 'SENATE_REVIEW', 'COUNCIL_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'PENDING');
ALTER TABLE "public"."GiftRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "GiftRequest" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "public"."RequestStatus_old";
ALTER TABLE "GiftRequest" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "GiftRequest" ADD COLUMN     "currentStage" "Role" NOT NULL DEFAULT 'ADVANCEMENT_OFFICE',
ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT;

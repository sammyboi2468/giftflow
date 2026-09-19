-- CreateTable
CREATE TABLE "StageHistory" (
    "id" TEXT NOT NULL,
    "giftRequestId" TEXT NOT NULL,
    "stage" "Role" NOT NULL,
    "action" TEXT NOT NULL,
    "resultingStatus" "RequestStatus" NOT NULL,
    "actedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_giftRequestId_fkey" FOREIGN KEY ("giftRequestId") REFERENCES "GiftRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_actedByUserId_fkey" FOREIGN KEY ("actedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

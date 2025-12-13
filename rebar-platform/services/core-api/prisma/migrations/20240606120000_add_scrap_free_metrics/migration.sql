-- Add scrap-free threshold to shops and production run tracking
ALTER TABLE "Shop" ADD COLUMN "scrapFreeThresholdPercent" DOUBLE PRECISION NOT NULL DEFAULT 2.0;

CREATE TABLE "ProductionRun" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  "stockUsedIn" DOUBLE PRECISION NOT NULL,
  "scrapLengthIn" DOUBLE PRECISION NOT NULL,
  "scrapPercent" DOUBLE PRECISION,
  "isScrapFree" BOOLEAN NOT NULL DEFAULT false,
  "scrapFreeThresholdPercent" DOUBLE PRECISION,
  "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductionRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProductionRun_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Generated manually due to offline tooling constraints. Aligns with services/core-api/prisma/schema.prisma.

CREATE TYPE "PalletStatus" AS ENUM ('planned', 'stacking', 'stacked', 'loaded');

CREATE TABLE "Shop" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "scrapFreeThresholdPercent" DOUBLE PRECISION NOT NULL DEFAULT 2.0
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "shopId" TEXT,
  CONSTRAINT "User_email_key" UNIQUE ("email"),
  CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ShopPalletConfig" (
  "shopId" TEXT PRIMARY KEY,
  "defaultMaxPalletWeightLbs" DOUBLE PRECISION NOT NULL,
  "palletLengthIn" DOUBLE PRECISION NOT NULL,
  "palletWidthIn" DOUBLE PRECISION NOT NULL,
  "allowOverhangIn" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "ShopPalletConfig_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  CONSTRAINT "Project_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "JobSheet" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourcePhotoPath" TEXT NOT NULL,
  "parsedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  CONSTRAINT "JobSheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Shape" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "barSize" TEXT NOT NULL,
  "finalLengthInches" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  "maxLengthInches" DOUBLE PRECISION,
  "shapeType" TEXT,
  "jobSheetId" TEXT,
  CONSTRAINT "Shape_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Shape_jobSheetId_fkey" FOREIGN KEY ("jobSheetId") REFERENCES "JobSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "BendRule" (
  "id" TEXT PRIMARY KEY,
  "barSize" TEXT NOT NULL,
  "angle" DOUBLE PRECISION NOT NULL,
  "stretchAllowance" DOUBLE PRECISION NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3)
);

CREATE TABLE "CutPlan" (
  "id" TEXT PRIMARY KEY,
  "jobSheetId" TEXT NOT NULL,
  "shapeId" TEXT NOT NULL,
  "stockLength" DOUBLE PRECISION NOT NULL,
  "cutLengths" TEXT NOT NULL,
  "scrapPieces" TEXT NOT NULL,
  "generatedBy" TEXT NOT NULL,
  CONSTRAINT "CutPlan_jobSheetId_fkey" FOREIGN KEY ("jobSheetId") REFERENCES "JobSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "BendPlan" (
  "id" TEXT PRIMARY KEY,
  "shapeId" TEXT NOT NULL,
  "bendMarks" TEXT NOT NULL,
  "feedLengths" TEXT NOT NULL,
  "angleSequence" TEXT NOT NULL,
  CONSTRAINT "BendPlan_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CutRun" (
  "id" TEXT PRIMARY KEY,
  "operatorId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "shapeId" TEXT NOT NULL,
  "completedCount" INTEGER NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CutRun_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "BendRun" (
  "id" TEXT PRIMARY KEY,
  "operatorId" TEXT NOT NULL,
  "shapeId" TEXT NOT NULL,
  "completedCount" INTEGER NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BendRun_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Pallet" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "maxWeightLbs" DOUBLE PRECISION NOT NULL,
  "totalWeightLbs" DOUBLE PRECISION NOT NULL,
  "status" "PalletStatus" NOT NULL,
  "overhangWarning" BOOLEAN,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pallet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PalletLayer" (
  "id" TEXT PRIMARY KEY,
  "palletId" TEXT NOT NULL,
  "layerIndex" INTEGER NOT NULL,
  "weightLbs" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "maxLengthInches" DOUBLE PRECISION,
  "overhangWarning" BOOLEAN,
  CONSTRAINT "PalletLayer_palletId_fkey" FOREIGN KEY ("palletId") REFERENCES "Pallet"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PalletPiece" (
  "id" TEXT PRIMARY KEY,
  "palletLayerId" TEXT NOT NULL,
  "shapeId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "weightPerPieceLbs" DOUBLE PRECISION NOT NULL,
  "totalWeightLbs" DOUBLE PRECISION NOT NULL,
  "shapeLabel" TEXT,
  CONSTRAINT "PalletPiece_palletLayerId_fkey" FOREIGN KEY ("palletLayerId") REFERENCES "PalletLayer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PalletPiece_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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

CREATE TABLE "PerceivedStretch" (
  "id" TEXT PRIMARY KEY,
  "barSize" TEXT NOT NULL,
  "angleDeg" DOUBLE PRECISION NOT NULL,
  "offsetIn" DOUBLE PRECISION NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "FeedDraw" (
  "id" TEXT PRIMARY KEY,
  "barSize" TEXT NOT NULL,
  "angleDeg" DOUBLE PRECISION NOT NULL,
  "drawIn" DOUBLE PRECISION NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isProvisional" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "MachineConfig" (
  "id" TEXT PRIMARY KEY,
  "machineId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "offset4BarIn" DOUBLE PRECISION NOT NULL,
  "offset5BarIn" DOUBLE PRECISION NOT NULL,
  "offset6BarIn" DOUBLE PRECISION NOT NULL,
  "globalConfigOffsetIn" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "MachineConfig_machineId_key" UNIQUE ("machineId")
);

CREATE TABLE "ScrapRecord" (
  "id" TEXT PRIMARY KEY,
  "length" DOUBLE PRECISION NOT NULL,
  "barSize" TEXT NOT NULL,
  "stockRemaining" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL
);

CREATE TABLE "FutureStockPiece" (
  "id" TEXT PRIMARY KEY,
  "barSize" TEXT NOT NULL,
  "length" DOUBLE PRECISION NOT NULL,
  "location" TEXT NOT NULL,
  "reservedForProjectId" TEXT
);

CREATE TABLE "CallLog" (
  "id" TEXT PRIMARY KEY,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "duration" INTEGER NOT NULL,
  "outcome" TEXT NOT NULL,
  "transcriptPath" TEXT,
  "summary" TEXT,
  "disposition" TEXT
);

CREATE TABLE "Lead" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL,
  "shopName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactRole" TEXT NOT NULL,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "region" TEXT,
  "workflowType" TEXT,
  "scrapPainLevel" TEXT,
  "leadScore" INTEGER,
  "shopId" TEXT,
  CONSTRAINT "Lead_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Deal" (
  "id" TEXT PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "shopId" TEXT,
  "status" TEXT NOT NULL,
  "expectedMonthlySeatCount" INTEGER,
  "expectedSeatPrice" DOUBLE PRECISION,
  "expectedNetRevenueAnnual" DOUBLE PRECISION,
  "commissionRateRep" DOUBLE PRECISION,
  "commissionRateMarketingFund" DOUBLE PRECISION,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Deal_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "CommissionRecord" (
  "id" TEXT PRIMARY KEY,
  "dealId" TEXT NOT NULL,
  "salesContributorId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "netRevenue" DOUBLE PRECISION NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL,
  CONSTRAINT "CommissionRecord_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MarketingFundLedger" (
  "id" TEXT PRIMARY KEY,
  "entryId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "PalletLayer_palletId_idx" ON "PalletLayer" ("palletId");
CREATE INDEX "PalletPiece_layerId_idx" ON "PalletPiece" ("palletLayerId");
CREATE INDEX "PalletPiece_shapeId_idx" ON "PalletPiece" ("shapeId");
CREATE INDEX "ProductionRun_projectId_idx" ON "ProductionRun" ("projectId");
CREATE INDEX "ProductionRun_shopId_idx" ON "ProductionRun" ("shopId");
CREATE INDEX "Shape_projectId_idx" ON "Shape" ("projectId");

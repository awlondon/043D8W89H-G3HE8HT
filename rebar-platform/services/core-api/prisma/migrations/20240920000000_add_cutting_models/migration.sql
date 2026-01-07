-- Generated manually due to offline tooling constraints. Aligns with services/core-api/prisma/schema.prisma.

DROP TABLE IF EXISTS "CutPlan";

CREATE TABLE "RebarInventory" (
  "id" TEXT PRIMARY KEY,
  "barDiameter" TEXT NOT NULL,
  "barLength" DOUBLE PRECISION NOT NULL,
  "quantityAvailable" INTEGER NOT NULL,
  "notes" TEXT
);

CREATE TABLE "CutRequest" (
  "id" TEXT PRIMARY KEY,
  "requestedLength" DOUBLE PRECISION NOT NULL,
  "diameter" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "inventoryBarId" TEXT NOT NULL,
  "inventoryCheck" BOOLEAN NOT NULL DEFAULT false,
  "totalCutLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "CutRequest_inventoryBarId_fkey" FOREIGN KEY ("inventoryBarId") REFERENCES "RebarInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Job" (
  "id" TEXT PRIMARY KEY,
  "jobName" TEXT NOT NULL,
  "priority" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "totalBars" INTEGER NOT NULL DEFAULT 0,
  "totalScrap" DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE TABLE "Bar" (
  "id" TEXT PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "diameter" TEXT NOT NULL,
  "length" DOUBLE PRECISION NOT NULL,
  "bends" INTEGER NOT NULL,
  "bendAngles" JSONB NOT NULL,
  "stretchAllowance" DOUBLE PRECISION NOT NULL,
  "cutLength" DOUBLE PRECISION NOT NULL,
  "remainingLength" DOUBLE PRECISION NOT NULL,
  "scrapFlag" BOOLEAN NOT NULL DEFAULT false,
  "operatorPrompt" TEXT,
  CONSTRAINT "Bar_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CutPlan" (
  "id" TEXT PRIMARY KEY,
  "barId" TEXT NOT NULL,
  "nextBarId" TEXT,
  CONSTRAINT "CutPlan_barId_fkey" FOREIGN KEY ("barId") REFERENCES "Bar"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CutPlan_nextBarId_fkey" FOREIGN KEY ("nextBarId") REFERENCES "Bar"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "CutRequest_status_idx" ON "CutRequest"("status");
CREATE INDEX "CutRequest_inventoryBarId_idx" ON "CutRequest"("inventoryBarId");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Bar_jobId_idx" ON "Bar"("jobId");
CREATE INDEX "Bar_remainingLength_idx" ON "Bar"("remainingLength");
CREATE INDEX "CutPlan_barId_idx" ON "CutPlan"("barId");
CREATE INDEX "CutPlan_nextBarId_idx" ON "CutPlan"("nextBarId");

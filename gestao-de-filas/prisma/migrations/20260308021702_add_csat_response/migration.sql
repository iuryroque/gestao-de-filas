/*
  Warnings:

  - You are about to drop the `SmsMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SmsMessage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CsatResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "deskId" TEXT,
    "queueId" TEXT,
    "service" TEXT,
    "rating" INTEGER,
    "comment" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CsatResponse_ticketId_key" ON "CsatResponse"("ticketId");

-- CreateIndex
CREATE INDEX "CsatResponse_deskId_idx" ON "CsatResponse"("deskId");

-- CreateIndex
CREATE INDEX "CsatResponse_queueId_service_idx" ON "CsatResponse"("queueId", "service");

-- CreateIndex
CREATE INDEX "CsatResponse_createdAt_idx" ON "CsatResponse"("createdAt");

-- CreateIndex
CREATE INDEX "CsatResponse_flagged_idx" ON "CsatResponse"("flagged");

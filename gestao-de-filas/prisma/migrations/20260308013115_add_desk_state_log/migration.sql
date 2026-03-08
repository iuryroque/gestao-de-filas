-- CreateTable
CREATE TABLE "DeskStateLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deskId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "reason" TEXT,
    "actorRole" TEXT,
    "queueId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeskStateLog_deskId_fkey" FOREIGN KEY ("deskId") REFERENCES "Desk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DeskStateLog_deskId_idx" ON "DeskStateLog"("deskId");

-- CreateIndex
CREATE INDEX "DeskStateLog_createdAt_idx" ON "DeskStateLog"("createdAt");

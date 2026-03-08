-- CreateTable
CREATE TABLE "SlaBreachLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queueId" TEXT NOT NULL,
    "tmeMinutes" REAL NOT NULL,
    "slaLimit" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SlaBreachLog_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tma" INTEGER NOT NULL DEFAULT 5,
    "sla" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Queue" ("createdAt", "id", "isActive", "name", "tma") SELECT "createdAt", "id", "isActive", "name", "tma" FROM "Queue";
DROP TABLE "Queue";
ALTER TABLE "new_Queue" RENAME TO "Queue";
CREATE UNIQUE INDEX "Queue_name_key" ON "Queue"("name");
CREATE INDEX "Queue_name_idx" ON "Queue"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SlaBreachLog_queueId_idx" ON "SlaBreachLog"("queueId");

-- CreateIndex
CREATE INDEX "SlaBreachLog_createdAt_idx" ON "SlaBreachLog"("createdAt");

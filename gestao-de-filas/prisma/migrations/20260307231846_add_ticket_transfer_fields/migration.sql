-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL DEFAULT '',
    "number" INTEGER NOT NULL,
    "queueId" TEXT NOT NULL,
    "deskId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "service" TEXT,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "tma" INTEGER,
    "transferredFromId" TEXT,
    "transferredToId" TEXT,
    "transferCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "Ticket_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_deskId_fkey" FOREIGN KEY ("deskId") REFERENCES "Desk" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("calledAt", "code", "createdAt", "deskId", "finishedAt", "id", "isPriority", "noShowCount", "number", "priority", "queueId", "service", "status", "tma", "userId") SELECT "calledAt", "code", "createdAt", "deskId", "finishedAt", "id", "isPriority", "noShowCount", "number", "priority", "queueId", "service", "status", "tma", "userId" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE INDEX "Ticket_queueId_number_idx" ON "Ticket"("queueId", "number");
CREATE INDEX "Ticket_queueId_isPriority_status_idx" ON "Ticket"("queueId", "isPriority", "status");
CREATE INDEX "Ticket_deskId_status_idx" ON "Ticket"("deskId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

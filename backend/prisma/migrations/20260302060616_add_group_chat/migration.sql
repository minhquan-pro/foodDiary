-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_conversations" ("created_at", "id", "updated_at") SELECT "created_at", "id", "updated_at" FROM "conversations";
DROP TABLE "conversations";
ALTER TABLE "new_conversations" RENAME TO "conversations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

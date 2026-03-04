-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_url" TEXT,
    "message" TEXT,
    "type" TEXT NOT NULL DEFAULT 'info',
    "user_id" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_announcements" ("created_at", "expires_at", "id", "message", "type", "user_id") SELECT "created_at", "expires_at", "id", "message", "type", "user_id" FROM "announcements";
DROP TABLE "announcements";
ALTER TABLE "new_announcements" RENAME TO "announcements";
CREATE INDEX "announcements_expires_at_idx" ON "announcements"("expires_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

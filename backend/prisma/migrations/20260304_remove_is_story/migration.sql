-- Remove is_story column from posts table
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_url" TEXT NOT NULL,
    "restaurant_name" TEXT NOT NULL,
    "dish_name" TEXT,
    "restaurant_address" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "rating" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "share_slug" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_posts" ("id", "image_url", "restaurant_name", "dish_name", "restaurant_address", "latitude", "longitude", "rating", "description", "share_slug", "user_id", "created_at", "updated_at") SELECT "id", "image_url", "restaurant_name", "dish_name", "restaurant_address", "latitude", "longitude", "rating", "description", "share_slug", "user_id", "created_at", "updated_at" FROM "posts";
DROP TABLE "posts";
ALTER TABLE "new_posts" RENAME TO "posts";
CREATE UNIQUE INDEX "posts_share_slug_key" ON "posts"("share_slug");
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at" DESC);
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

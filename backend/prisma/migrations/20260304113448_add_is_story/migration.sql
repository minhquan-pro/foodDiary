-- RedefineTables
PRAGMA defer_foreign_keys=ON;
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
    "is_story" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_posts" ("created_at", "description", "dish_name", "id", "image_url", "latitude", "longitude", "rating", "restaurant_address", "restaurant_name", "share_slug", "updated_at", "user_id") SELECT "created_at", "description", "dish_name", "id", "image_url", "latitude", "longitude", "rating", "restaurant_address", "restaurant_name", "share_slug", "updated_at", "user_id" FROM "posts";
DROP TABLE "posts";
ALTER TABLE "new_posts" RENAME TO "posts";
CREATE UNIQUE INDEX "posts_share_slug_key" ON "posts"("share_slug");
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at" DESC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

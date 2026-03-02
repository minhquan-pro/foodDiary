-- CreateTable
CREATE TABLE "post_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emoji" TEXT NOT NULL DEFAULT '❤️',
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "post_reactions_post_id_idx" ON "post_reactions"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_reactions_user_id_post_id_emoji_key" ON "post_reactions"("user_id", "post_id", "emoji");

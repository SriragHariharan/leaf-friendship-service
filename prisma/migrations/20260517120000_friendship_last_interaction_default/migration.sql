-- Backfill existing rows: treat missing last interaction as friendship creation time.
-- Prisma cannot default one column to another; @default(now()) on insert matches created_at in practice.
UPDATE `friendships`
SET `last_interaction_at` = `created_at`
WHERE `last_interaction_at` IS NULL;

-- AlterTable
ALTER TABLE `friendships` MODIFY `last_interaction_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

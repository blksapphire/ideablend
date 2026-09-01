-- AlterEnum
-- PostgreSQL doesn't allow ALTER TYPE ... ADD VALUE inside the same
-- transaction as other statements that might use it, so this migration
-- only adds the value; Prisma runs each migration file in its own
-- transaction, so this is safe as a standalone file.
ALTER TYPE "TaskStatus" ADD VALUE 'IN_REVIEW';

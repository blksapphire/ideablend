-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('IDEA', 'PLANNING', 'MVP', 'BETA', 'LIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('STARTUP', 'OPEN_SOURCE', 'SIDE_PROJECT', 'HACKATHON', 'RESEARCH', 'COMMUNITY', 'EXPERIMENTAL');

-- CreateEnum
CREATE TYPE "CommitmentType" AS ENUM ('VOLUNTEER', 'EQUITY', 'PAID', 'MIXED');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('ANY', 'JUNIOR', 'MID', 'SENIOR');

-- CreateEnum
CREATE TYPE "AvailabilityBand" AS ENUM ('HOURS_5_10', 'HOURS_10_20', 'HOURS_20_40', 'FULL_TIME');

-- AlterTable: User profile fields
ALTER TABLE "User"
  ADD COLUMN "linkedinUrl" TEXT,
  ADD COLUMN "websiteUrl" TEXT,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "openToProjects" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "openToCofounder" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "openToFreelance" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "openToEmployment" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "availability" "AvailabilityBand";

-- AlterTable: Project stage/type/commitment
ALTER TABLE "Project"
  ADD COLUMN "stage" "ProjectStage" NOT NULL DEFAULT 'IDEA',
  ADD COLUMN "type" "ProjectType",
  ADD COLUMN "commitment" "CommitmentType";

-- AlterTable: Role description/experience/commitment
ALTER TABLE "Role"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "experience" "ExperienceLevel" NOT NULL DEFAULT 'ANY',
  ADD COLUMN "commitment" "CommitmentType";

-- CreateTable
CREATE TABLE "RoleSkill" (
    "roleId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "RoleSkill_pkey" PRIMARY KEY ("roleId","skillId")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "revieweeId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_projectId_reviewerId_revieweeId_key" ON "Review"("projectId", "reviewerId", "revieweeId");

-- AddForeignKey
ALTER TABLE "RoleSkill" ADD CONSTRAINT "RoleSkill_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkill" ADD CONSTRAINT "RoleSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

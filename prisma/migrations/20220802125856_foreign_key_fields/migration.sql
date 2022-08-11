/*
  Warnings:

  - You are about to drop the column `userId` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `trips` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizerId` to the `trips` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "groups" DROP CONSTRAINT "groups_userId_fkey";

-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_groupId_fkey";

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "userId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "trips" DROP COLUMN "groupId",
ADD COLUMN     "organizerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

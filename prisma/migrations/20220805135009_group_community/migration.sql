/*
  Warnings:

  - You are about to drop the column `groupId` on the `banks` table. All the data in the column will be lost.
  - You are about to drop the `_sharedGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `groups` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `communityId` to the `banks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_followers" DROP CONSTRAINT "_followers_A_fkey";

-- DropForeignKey
ALTER TABLE "_manager" DROP CONSTRAINT "_manager_A_fkey";

-- DropForeignKey
ALTER TABLE "_sharedGroup" DROP CONSTRAINT "_sharedGroup_A_fkey";

-- DropForeignKey
ALTER TABLE "_sharedGroup" DROP CONSTRAINT "_sharedGroup_B_fkey";

-- DropForeignKey
ALTER TABLE "banks" DROP CONSTRAINT "banks_groupId_fkey";

-- DropForeignKey
ALTER TABLE "groups" DROP CONSTRAINT "groups_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "trips" DROP CONSTRAINT "trips_organizerId_fkey";

-- AlterTable
ALTER TABLE "banks" DROP COLUMN "groupId",
ADD COLUMN     "communityId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_sharedGroup";

-- DropTable
DROP TABLE "groups";

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "communityUsername" TEXT,
    "profile" TEXT,
    "banner" TEXT,
    "bio" TEXT,
    "contactNumber" TEXT,
    "creatorId" TEXT NOT NULL,
    "deletedStatus" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_sharedCommunity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "communities_communityUsername_key" ON "communities"("communityUsername");

-- CreateIndex
CREATE UNIQUE INDEX "_sharedCommunity_AB_unique" ON "_sharedCommunity"("A", "B");

-- CreateIndex
CREATE INDEX "_sharedCommunity_B_index" ON "_sharedCommunity"("B");

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_manager" ADD FOREIGN KEY ("A") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_followers" ADD FOREIGN KEY ("A") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sharedCommunity" ADD FOREIGN KEY ("A") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sharedCommunity" ADD FOREIGN KEY ("B") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

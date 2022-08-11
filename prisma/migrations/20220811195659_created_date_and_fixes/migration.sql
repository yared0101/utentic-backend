/*
  Warnings:

  - You are about to drop the column `category` on the `trips` table. All the data in the column will be lost.
  - Added the required column `updatedDate` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `communities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedDate` to the `communities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `trips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedDate` to the `trips` table without a default value. This is not possible if the table is not empty.
  - Made the column `endDate` on table `trips` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `trips` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedDate` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "trips" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "discounted" SET DEFAULT false,
ALTER COLUMN "discountAmount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedDate" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

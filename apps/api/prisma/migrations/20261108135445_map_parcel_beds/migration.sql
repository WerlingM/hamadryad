-- CreateEnum
CREATE TYPE "Sunlight" AS ENUM ('FULL_SUN', 'PART_SHADE', 'FULL_SHADE');

-- CreateEnum
CREATE TYPE "Moisture" AS ENUM ('DRY', 'AVERAGE', 'MOIST', 'WET');

-- AlterTable
ALTER TABLE "homes" ADD COLUMN     "parcelGeometry" geometry(MultiPolygon, 4326);

-- CreateTable
CREATE TABLE "beds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "yardId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sunlight" "Sunlight" NOT NULL,
    "moisture" "Moisture" NOT NULL,
    "geometry" geometry(Polygon, 4326),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "beds_yardId_idx" ON "beds"("yardId");

-- CreateIndex
CREATE INDEX "beds_geometry_idx" ON "beds" USING GIST ("geometry");

-- CreateIndex
CREATE INDEX "homes_parcelGeometry_idx" ON "homes" USING GIST ("parcelGeometry");

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_yardId_fkey" FOREIGN KEY ("yardId") REFERENCES "yards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

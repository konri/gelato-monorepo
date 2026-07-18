-- News authored by a spot (spot attribution + city-scoped feed via spot.cityId).
ALTER TABLE "News" ADD COLUMN "spotId" TEXT;

ALTER TABLE "News" ADD CONSTRAINT "News_spotId_fkey"
  FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "News_spotId_idx" ON "News"("spotId");

-- Optional threaded replies on comments.
ALTER TABLE "NewsComment" ADD COLUMN "parentId" TEXT;

ALTER TABLE "NewsComment" ADD CONSTRAINT "NewsComment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "NewsComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "NewsComment_parentId_idx" ON "NewsComment"("parentId");

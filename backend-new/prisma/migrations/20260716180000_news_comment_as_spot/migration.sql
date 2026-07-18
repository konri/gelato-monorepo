-- Official spot replies: when set, a comment is shown as the spot (name+logo)
-- rather than the individual staff member who wrote it.
ALTER TABLE "NewsComment" ADD COLUMN "asSpotId" TEXT;

-- Drop the previous room membership relation.
-- Move room membership from Room.memberId to User.roomId.
ALTER TABLE "User" ADD COLUMN "roomId" INTEGER;

UPDATE "User" AS "u"
SET "roomId" = (
    SELECT "A"
    FROM "_RoomMembers"
    WHERE "B" = "u"."id"
    ORDER BY "A"
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM "_RoomMembers" WHERE "B" = "u"."id"
);

UPDATE "User" AS "u"
SET "roomId" = "r"."id"
FROM "Room" AS "r"
WHERE "r"."memberId" = "u"."id" AND "u"."roomId" IS NULL;

DROP TABLE "_RoomMembers";
ALTER TABLE "Room" DROP CONSTRAINT "Room_memberId_fkey";
ALTER TABLE "Room" DROP COLUMN "memberId";

ALTER TABLE "User" ADD CONSTRAINT "User_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
import { Router } from "express";
import { validate } from "../middleware/validateMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { createRoom } from "../handlers/roomHandlers/createRoom.js";
import { deleteRoom } from "../handlers/roomHandlers/deleteRoom.js";
import { joinRoom } from "../handlers/roomHandlers/joinRoom.js";
import { leaveRoom } from "../handlers/roomHandlers/leaveRoom.js";
import { createRoomSchema, deleteRoomSchema, joinRoomSchema, leaveRoomSchema } from "../schema.js";

const roomRouter = Router();

roomRouter.post("/room", authenticate, validate(createRoomSchema), createRoom);
roomRouter.delete("/room/:roomId", authenticate, validate(deleteRoomSchema), deleteRoom);
roomRouter.post("/room/:roomId/join", authenticate, validate(joinRoomSchema), joinRoom);
roomRouter.patch("/room/:roomId/leave", authenticate, validate(leaveRoomSchema), leaveRoom);

export default roomRouter;

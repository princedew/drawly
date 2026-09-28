import type { Request, Response } from "express";
import { leaveRoom as leaveRoomRecord } from "@packages/query/query.js";
import { AppError } from "../../middleware/errorMiddleware.js";

export async function leaveRoom(req: Request, res: Response) {
  const roomId = Number(req.params.roomId);
  const memberId = res.locals.userId as number;
  const result = await leaveRoomRecord(roomId, memberId);

  if (result.count === 0) {
    throw new AppError("Room membership not found", 404, "[ leaveRoom.ts ]");
  }

  return res.status(200).json({ success: true, message: "Left room" });
}
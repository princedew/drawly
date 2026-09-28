import type { Request, Response } from "express";
import { joinRoom as joinRoomRecord } from "@packages/query/query.js";
import { AppError } from "../../middleware/errorMiddleware.js";

export async function joinRoom(req: Request, res: Response) {
  const roomId = Number(req.params.roomId);
  const memberId = res.locals.userId as number;
  const room = await joinRoomRecord(roomId, memberId);

  if (!room) {
    throw new AppError("Room not found", 404, "[ joinRoom.ts ]");
  }

  return res.status(200).json({ success: true, room });
}
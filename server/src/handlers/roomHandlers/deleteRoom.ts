import type { Request, Response } from "express";
import { deleteRoom as deleteRoomRecord } from "@packages/query/query.js";
import { AppError } from "../../middleware/errorMiddleware.js";

export async function deleteRoom(req: Request, res: Response) {
  const roomId = Number(req.params.roomId);
  const result = await deleteRoomRecord(roomId);

  if (result.count === 0) {
    throw new AppError("Room not found", 404, "[ deleteRoom.ts ]");
  }

  return res.status(200).json({ success: true, message: "Room deleted" });
}
import type { Request, Response } from "express";
import { createRoom as createRoomRecord } from "@packages/query/query.js";

type RequestBody = { name: string }

export async function createRoom(req: Request, res: Response) {
	const name = (req.body as RequestBody ).name;
	const memberId = res.locals.userId as number;
    console.log("name:",name);
    console.log("memberId:",memberId);
	const room = await createRoomRecord(memberId, name);

	return res.status(201).json({ success: true, room });
}

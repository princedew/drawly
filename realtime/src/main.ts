import { prisma } from "../../package/db/lib/prisma.js";
import { WebSocket, WebSocketServer } from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
type CordinateType = number | null;
type LineDataType = {
  type: string;
  line: {
    startX: CordinateType;
    startY: CordinateType;
    endX: CordinateType;
    endY: CordinateType;
  };
};

const wss = new WebSocketServer({ port: 8000 });

const registry = new Map<number, WebSocket>();
const room = new Map<number, Set<number>>();

function time() {
  return String(new Date(Date.now())).split(" ")[4];
}

function removeUserFromRooms(userId: number) {
  for (const [roomId, users] of room.entries()) {
    users.delete(userId);
    if (users.size === 0) {
      room.delete(roomId);
    }
  }
}

function addUserToRoom(roomId: number, userId: number) {
  removeUserFromRooms(userId);
  const users = room.get(roomId) ?? new Set<number>();
  users.add(userId);
  room.set(roomId, users);
}

function broadcastToRoom(data: unknown, roomId: number, senderId: number) {
  const users = room.get(roomId);
  if (!users?.has(senderId)) return;

  for (const userId of users) {
    if (userId === senderId) continue;
    const ws = registry.get(userId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

async function removeUserFromRoom(userId: number) {
  try {
    const user = await prisma.user.update({
      where: { id:userId },
      data: { roomId: null },
      select: { id: true },
    });
    if (!user) {
      return;
    }
    return user;
  } catch (error) {
    if (error instanceof Error) {
      console.log("ERROR:", error.message);
    } else {
      console.log("ERROR:", error);
    }
  }
}

wss.on("connection", (ws, req) => {
  let userId: number;

  const cookie = req.headers.cookie;
  if (!cookie) {
    console.log("COOKIE:", cookie);
    return ws.close(1008, "Unauthorized");
  }
  const token = cookie.split("=")[1];
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    console.log("COOKIE:", cookie);
    console.log("TOKEN:", cookie.split("=")[1]);
    return;
  }

  const payload = jwt.verify(token, secret);
  if (!payload) {
    console.log("PAYLOAD:", payload);
    return;
  }

  if (typeof payload.userId !== "number") {
    console.log("PAYLOAD: ", payload);
    return ws.close(1008, "Invalid payload");
  }
  userId = payload.userId;

  console.log(`[${time()}] CLIENT CONNECTED : ${userId}`);

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());
    console.log("WS-SERVER RECV: ", data);

    if (data.type === "FIRST-MSG") {
      if (data.userId !== userId) return ws.close(1008, "Invalid user ID");
      console.log(`[${time()}] USERID-INFO :`, userId);
      registry.set(userId, ws);
    }

    if (
      (data.type === "CREATE-ROOM" ||
        data.type === "JOIN-ROOM" ||
        data.type === "LEAVE-ROOM") &&
      data.userId === userId &&
      typeof data.userId === "number" &&
      data.roomId > 0
    ) {
      if (data.type === "LEAVE-ROOM") {
        room.get(data.roomId).delete(userId);
        if (room.get(data.roomId)?.size === 0) room.delete(data.roomId);
      } else {
        addUserToRoom(data.roomId, userId);
      }
    }

    if (
      data.type === "START-COORDINATE" ||
      data.type === "MOVING-COORDINATE" ||
      data.type === "END-COORDINATE"
    ) {
      if (typeof data.roomId === "number" && data.roomId > 0) {
        broadcastToRoom(data, data.roomId, userId);
      }
    }
  });

  ws.on("close", async () => {
    console.log(`[${time()}] CLIENT DIS-CONNECTED`);
    registry.delete(userId);
    removeUserFromRooms(userId);
    const user = await removeUserFromRoom(userId);
    if (!user) {
      return;
    }
  });
});

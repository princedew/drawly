import { prisma } from "../../package/db/lib/prisma.js";
import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

type RectImageType = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

type CoOrdinateObject = {
  x: number;
  y: number;
};

type Tool = "PENCIL" | "RECTANGLE";

type EventType = "START-COORDINATE" | "MOVING-COORDINATE" | "END-COORDINATE";
type PencilDataType = {
  type: EventType;
  tool: Tool;
  userId: number;
  color: string;
  coOrdinate: CoOrdinateObject;
};

type RoomDrawing = {
  rectangleDrawing: RectImageType[];
  pencilDrawing: PencilDataType[];
};

const wss = new WebSocketServer({ port: 8000 });

const registry = new Map<number, WebSocket>();
const room = new Map<number, Set<number>>();

const roomDrawing = new Map<number, RoomDrawing>();

function sendRoomDrawing(ws: WebSocket, roomId: number) {
  const roomDrawingObj = roomDrawing.get(roomId);

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "PREV-DRAWING",
        roomId,
        roomDrawingObj,
      }),
    );
  }
}

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
  const users = room.get(roomId);
  if (!users) {
    const allUsers = new Set<number>();
    allUsers.add(userId);
    room.set(roomId, allUsers);
  } else {
    users.add(userId);
    room.set(roomId, users);
  }
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

function addRectangleInRoomMap(data) {
  const [x, y, w, h] = data.rectData;
  let roomDrawingObj = roomDrawing.get(data.roomId);
  if (!roomDrawingObj) {
    roomDrawingObj = { rectangleDrawing: [], pencilDrawing: [] };
    roomDrawing.set(data.roomId, roomDrawingObj);
  }
  roomDrawingObj.rectangleDrawing.push({ x, y, w, h, color: data.color });
  roomDrawing.set(data.roomId, roomDrawingObj);
}

function addPencilLineSegmentsInRoomMap(data) {
  if (!data.collectionOfPencilLineSegment) {
    console.log("No collection of pencil lineSegment");
    return;
  }
  let roomDrawingObj = roomDrawing.get(data.roomId);
  if (!roomDrawingObj) {
    roomDrawingObj = { rectangleDrawing: [], pencilDrawing: [] };
    roomDrawing.set(data.roomId, roomDrawingObj);
  }
  roomDrawingObj.pencilDrawing.push(data.collectionOfPencilLineSegment);
  roomDrawing.set(data.roomId, roomDrawingObj);
}

function addUserInRegistryMap(data, userId, ws) {
  if (data.userId !== userId) return ws.close(1008, "Invalid user ID");
  console.log(`[${time()}] USERID-INFO :`, userId);
  registry.set(userId, ws);
}

function removeUserFromRegistryMap(userId) {
  console.log(`[${time()}] CLIENT DIS-CONNECTED`);
  registry.delete(userId);
}

function authenthicate(cookie, ws) {
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
  let userId = payload.userId;

  console.log(`[${time()}] CLIENT CONNECTED : ${userId}`);
  return userId;
}

wss.on("connection", (ws, req) => {
  let userId = authenthicate(req.headers.cookie, ws);

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());
    console.log("WS-SERVER RECV: ", data);

    if (data.type === "FIRST-MSG") {
      addUserInRegistryMap(data, userId, ws);
    }
    if (data.type === "JOIN-ROOM") {
      sendRoomDrawing(ws, data.roomId);
    }
    if (data.type === "LEAVE-ROOM") {
      removeUserFromRooms(userId);
    }
    if (
      (data.type === "CREATE-ROOM" || data.type === "JOIN-ROOM") &&
      data.userId === userId
    ) {
      addUserToRoom(data.roomId, userId);
    }
    if (
      (data.type === "START-COORDINATE" ||
        data.type === "MOVING-COORDINATE" ||
        data.type === "END-COORDINATE") &&
      data.userId === userId
    ) {
      broadcastToRoom(data, data.roomId, userId);
    }
    if (data.tool === "RECTANGLE" && data.type === "END-COORDINATE") {
      addRectangleInRoomMap(data);
    }
    if (data.tool === "PENCIL" && data.type === "END-COORDINATE") {
      addPencilLineSegmentsInRoomMap(data);
    }
  });

  ws.on("close", async () => {
    removeUserFromRegistryMap(userId);
    removeUserFromRooms(userId);
  });
});

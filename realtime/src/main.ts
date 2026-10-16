import { prisma } from "../../package/db/lib/prisma.js";
import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import type {
  wsData,
  wsDataForPencilLineSegmentCollection,
  RectDataForDrawingStore,
  PencilDataForDrawingStore,
} from "../../web/src/pages/Canvas.js";

function time() {
  return String(new Date(Date.now())).split(" ")[4];
}

// type RectImageType = {
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   color: string;
// };

// type CoOrdinateObject = {
//   x: number;
//   y: number;
// };

// type Tool = "PENCIL" | "RECTANGLE";

// type EventType = "START-COORDINATE" | "MOVING-COORDINATE" | "END-COORDINATE";
// type PencilDataType = {
//   type: EventType;
//   tool: Tool;
//   userId: number;
//   color: string;
//   coOrdinate: CoOrdinateObject;
// };

type RoomDrawing = RectDataForDrawingStore | PencilDataForDrawingStore[] | [];

const wss = new WebSocketServer({ port: 8000 });

const registry = new Map<number, WebSocket>();
const room = new Map<number, Set<number>>();
const roomDrawing = new Map<number, RoomDrawing[]>();

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

// -------------------------
// REGISTRY ADD/ REMOVE
// -------------------------
function addUserInRegistryMap(data, userId, ws) {
  if (data.userId !== userId) return ws.close(1008, "Invalid user ID");
  console.log(`[${time()}] USERID-INFO :`, userId);
  registry.set(userId, ws);
}
function removeUserFromRegistryMap(userId) {
  console.log(`[${time()}] CLIENT DIS-CONNECTED`);
  registry.delete(userId);
}

// -------------------
// ROOM ADD/ REMOVE
// -------------------
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
function removeUserFromRooms(userId: number) {
  for (const [roomId, users] of room.entries()) {
    users.delete(userId);
    if (users.size === 0) {
      room.delete(roomId);
    }
  }
}

// -------------------------------
// ADD DRAWINGS IN ROOMDATA
// -------------------------------
function addRectangleInRoomMap(data: Omit<wsData, "coOrdinate">) {
  const [x, y, w, h] = data.rectData;
  let roomDrawingArr = roomDrawing.get(data.roomId);
  if (!roomDrawingArr) {
    roomDrawingArr = [];
    roomDrawing.set(data.roomId, roomDrawingArr);
  }
  roomDrawingArr.push({
    id: data.id,
    type: data.type,
    tool: data.tool,
    x,
    y,
    w,
    h,
    color: data.color,
  });
  roomDrawing.set(data.roomId, roomDrawingArr);
}
function addPencilLineSegmentsInRoomMap(
  data: wsDataForPencilLineSegmentCollection,
) {
  if (!data.collectionOfPencilLineSegment) {
    console.log("No collection of pencil lineSegment");
    return;
  }
  let roomDrawingArr = roomDrawing.get(data.roomId);
  if (!roomDrawingArr) {
    roomDrawingArr = [];
    roomDrawing.set(data.roomId, roomDrawingArr);
  }
  roomDrawingArr.push(data.collectionOfPencilLineSegment);
  roomDrawing.set(data.roomId, roomDrawingArr);
}

// -------------------
// OTHERS
// -------------------

function broadcastToRoom(
  data:
    | Omit<wsData, "rectData">
    | Omit<wsData, "coOrdinate">
    | wsDataForPencilLineSegmentCollection,
  roomId: number,
  senderId: number,
) {
  const users = room.get(roomId);
  if (!users) {
    console.log(`No users in roomId: ${roomId}`);
    return;
  }
  if (!users.has(senderId)) return;

  for (const userId of users) {
    if (userId === senderId) continue;
    const ws = registry.get(userId);
    if (ws?.readyState === WebSocket.OPEN) {
      if (
        data.type === "PENCIL-COLLECTION" &&
        "collectionOfPencilLineSegment" in data
      ) {
        ws.send(JSON.stringify(data.collectionOfPencilLineSegment));
      } else {
        if (data.tool === "RECTANGLE" && "rectData" in data) {
          const [x, y, w, h] = data.rectData;
          ws.send(
            JSON.stringify({
              id: data.id,
              type: data.type,
              tool: data.tool,
              color: data.color,
              x,
              y,
              w,
              h,
            }),
          );
        } else if (data.tool === "PENCIL" && "coOrdinate" in data) {
          ws.send(
            JSON.stringify({
              id: data.id,
              type: data.type,
              tool: data.tool,
              color: data.color,
              coOrdinate: data.coOrdinate,
            }),
          );
        }
      }
    }
  }
}

function roomOps(data, userId, ws) {
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
}

function authenthicate(cookie: string, ws: WebSocket) {
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
  if (!req.headers.cookie) {
    console.log("Cookie not found.");
    return;
  }
  let userId = authenthicate(req.headers.cookie, ws);

  ws.on("message", (msg) => {
    const data:
      | Omit<wsData, "rectData">
      | Omit<wsData, "coOrdinate">
      | wsDataForPencilLineSegmentCollection = JSON.parse(msg.toString());
    console.log("WS-SERVER RECV: ", data);

    roomOps(data, userId, ws);
    broadcastToRoom(data, data.roomId, data.userId)

    if (
      data.type !== "PENCIL-COLLECTION" &&
      data.tool === "RECTANGLE" &&
      data.type === "END" &&
      "rectData" in data
    ) {
      addRectangleInRoomMap(data as Omit<wsData, "coOrdinate">);
    }
    if (data.type === "PENCIL-COLLECTION") {
      addPencilLineSegmentsInRoomMap(data);
    }
  });

  ws.on("close", async () => {
    removeUserFromRegistryMap(userId);
    removeUserFromRooms(userId);
  });
});

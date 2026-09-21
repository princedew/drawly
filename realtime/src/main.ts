import { WebSocketServer } from "ws";

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

const registry = new Map<string, WebSocket>();

function time() {
  return String(new Date(Date.now())).split(" ")[4];
}

function broadCast(lineData: LineDataType) {
  for (const ws of registry.values()) {
    ws.send(JSON.stringify(lineData));
  }
}

wss.on("connection", (ws) => {
  let userId: string;
  console.log(`[${time()}] CLIENT CONNECTED`);

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());

    if (data.type === "FIRST-MSG") {
      console.log(`[${time()}] USERID-INFO :`, data.userId);
      registry.set(data.userId, ws);
      userId = data.userId;
    }

    if (data.type === "LINE-INFO") {
      console.log("LINE-INFO :", data.line);
      broadCast(data);
    }
  });

  ws.on("close", () => {
    console.log(`[${time()}] CLIENT DIS-CONNECTED`);
    registry.delete(userId);
  });
});

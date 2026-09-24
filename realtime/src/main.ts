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

function broadCast(data: any, uId: string) {
  for (const [userId, ws] of registry.entries()) {
    if (userId !== uId) {
      ws.send(JSON.stringify(data));
    }
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

    if(data.type === "START-COORDINATE" || data.type === "MOVING-COORDINATE" || data.type === "END-COORDINATE"){
      broadCast(data, userId);
    }

    // if(data.type === "LINE-RECORD"){
    //   broadCast(data, userId);
    // }

    // if (data.type === "LINE-INFO") {
    //   console.log("[WS SERVER] RECEIVING, LINE INFO :", data.line);
    //   broadCast(data, userId);
    // }
  });

  ws.on("close", () => {
    console.log(`[${time()}] CLIENT DIS-CONNECTED`);
    registry.delete(userId);
  });
});

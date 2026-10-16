import React, { useEffect, useRef } from "react";
import { useStore, type DrawingColor } from "../store/store";
import Room from "../components/Room";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useRender } from "../hooks/useRender";

import { DRAWING_COLORS } from "../utils/utils";

export const TOOL = {
  PENCIL: "PENCIL",
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
};

export type Tool = keyof typeof TOOL;

export type MouseEventType = "MOVING" | "START" | "END";

export type CoOrdinateObject = { x: number; y: number };

// --------------------------
export type wsData = {
  id: string;
  roomId: number;
  userId: number;
  type: MouseEventType;
  tool: Tool;
  color: DrawingColor;
  rectData: [number, number, number, number];
  coOrdinate: { x: number; y: number };
};

export type wsDataForPencilLineSegmentCollection = {
  id: string;
  type: "PENCIL-COLLECTION";
  roomId: number;
  userId: number;
  collectionOfPencilLineSegment: PencilDataForDrawingStore[];
};

// --------------------------
export type RectDataForDrawingStore = {
  id: string;
  type: MouseEventType;
  tool: Tool;
  x: number;
  y: number;
  w: number;
  h: number;
  color: DrawingColor;
};
export type PencilDataForDrawingStore = {
  id: string;
  type: MouseEventType;
  coOrdinate: CoOrdinateObject;
  color: DrawingColor;
};
export type DrawingStoreItem =
  | RectDataForDrawingStore
  | PencilDataForDrawingStore[];
const userDrawingStore: DrawingStoreItem[] = [];
// --------------------------

function Canvas() {
  const navigate = useNavigate();
  const { renderDrawings, updateRectangleInStore } = useRender();

  const tool = useStore((state) => state.tool);
  const color = useStore((state) => state.color);
  const userId = useStore((state) => state.userId);
  const roomData = useStore((state) => state.roomData);

  const idRef = useRef<string | null>(null);
  const isMoveRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rectStartingCoOrdinate = useRef<CoOrdinateObject | null>(null);
  const collectionOfPencilLineSegment = useRef<
    PencilDataForDrawingStore[] | []
  >([]);
  // const movingEventCountRef = useRef<number>(0);

  // const rectImage = useRef<{
  //   x: number;
  //   y: number;
  //   w: number;
  //   h: number;
  // } | null>(null);
  const wsc = useWebSocket(userId);
  console.log("USER-ID:", userId);

  useEffect(() => {
    if (userId === null) {
      navigate("/auth");
    }
  }, [navigate, userId]);

  // LISTENING WS MSG AND RENDERING DRAWING
  useEffect(() => {
    if (!wsc || userId === null) return;

    try {
      wsc.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);
        // console.log("PARSE-DATA:", data);
        if (data.userId === userId) return;
        if (!canvasRef.current) {
          console.log("No ref of canvas.");
          return;
        }
        if (!Array.isArray(data) && data.tool === "RECTANGLE") {
          updateRectangleInStore(userDrawingStore, data);
        } else {
          userDrawingStore.push(data);
        }
        renderDrawings(userDrawingStore, canvasRef.current);
        
      };
    } catch (error) {
      if (error instanceof Error) {
        console.log("ERROR:", error.message);
      } else {
        console.log("ERROR:", error);
      }
    }
  }, [wsc, userId]);

 
  function wsSend(
    data:
      | Omit<wsData, "rectData">
      | Omit<wsData, "coOrdinate">
      | wsDataForPencilLineSegmentCollection,
  ) {
    if (wsc && userId !== null && wsc.readyState === WebSocket.OPEN) {
      wsc.send(JSON.stringify({ ...data, roomId: roomData?.roomId ?? null }));
    }
  }

  // THIS FN ADD THE PENCIL OBJ FROM THE START AND MOVE FN TO THE REF ARRAY THAT WE SEND TO useRender()
  function addInPencilLineSegmentCollection(data: PencilDataForDrawingStore) {
    collectionOfPencilLineSegment.current = [
      ...collectionOfPencilLineSegment.current,
      data,
    ];
  }

  const start = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (userId === null) return;
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;

      ctx.strokeStyle = DRAWING_COLORS[color];
      ctx.lineWidth = 2;

      idRef.current = crypto.randomUUID();

      if (tool === "RECTANGLE") {
        rectStartingCoOrdinate.current = { x, y };
        // rectImage.current = { x, y, w: 0, h: 0 };
        userDrawingStore.push({
          id: idRef.current,
          type: "START",
          tool: TOOL.RECTANGLE as Tool,
          x,
          y,
          w: 0,
          h: 0,
          color,
        });
        renderDrawings(userDrawingStore, canvas);
        if (roomData) {
          wsSend({
            id: idRef.current,
            type: "START",
            tool,
            userId,
            roomId: roomData.roomId,
            color,
            rectData: [x, y, 0, 0],
          });
        }
      } else if (tool === "PENCIL") {
        ctx.beginPath();
        ctx.moveTo(x, y);
        const coOrdinate: CoOrdinateObject = { x, y };
        addInPencilLineSegmentCollection({
          id: idRef.current,
          type: "START",
          coOrdinate,
          color,
        });
        if (roomData) {
          wsSend({
            id: idRef.current,
            type: "START",
            tool,
            userId,
            roomId: roomData.roomId,
            color,
            coOrdinate,
          });
        }
      }
      isMoveRef.current = true;
    } catch (error) {
      console.log("\n> ERROR [fn start()]: ", error);
    }
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (userId === null) return;
    try {
      if (!isMoveRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (!idRef.current) {
        console.log("isRef is null in 'MOVING'.");
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;

      if (tool === "RECTANGLE") {
        const startingCoOrd = rectStartingCoOrdinate.current;
        if (!startingCoOrd) {
          console.log("No startingCorOrd.");
          return;
        }

        const startX = Math.min(startingCoOrd.x, x);
        const startY = Math.min(startingCoOrd.y, y);

        const w = Math.abs(startingCoOrd.x - x);
        const h = Math.abs(startingCoOrd.y - y);

        userDrawingStore.forEach((d) => {
          if ("id" in d && "type" in d) {
            if (d.id === idRef.current) {
              d.type = "END";
              d.x = startX;
              d.y = startY;
              d.w = w;
              d.h = h;
            }
          }
        });
        renderDrawings(userDrawingStore, canvas);
        if (roomData) {
          wsSend({
            id: idRef.current,
            type: "MOVING",
            tool,
            userId,
            roomId: roomData.roomId,
            color,
            rectData: [startX, startY, w, h],
          });
        }
      } else if (tool === "PENCIL") {
        ctx.strokeStyle = DRAWING_COLORS[color];
        ctx.lineTo(x, y);
        ctx.stroke();
        const coOrdinate: CoOrdinateObject = { x, y };
        addInPencilLineSegmentCollection({
          id: idRef.current,
          type: "MOVING",
          coOrdinate,
          color,
        });
        if (roomData) {
          wsSend({
            id: idRef.current,
            type: "MOVING",
            tool,
            userId,
            roomId: roomData.roomId,
            color,
            coOrdinate,
          });
        }
      }
    } catch (error) {
      console.log("\n> ERROR [fn move()] : ", error);
    }
  };

  const end = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (userId === null) return;
    if (!idRef.current) {
      console.log("idRef is null");
      return;
    }
    if (!isMoveRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x: number = e.clientX - rect.left;
    const y: number = e.clientY - rect.top;

    if (tool === "RECTANGLE") {
      const startingCoOrd = rectStartingCoOrdinate.current;
      if (!startingCoOrd) {
        console.log("No startingCorOrd.");
        return;
      }

      userDrawingStore.forEach((d) => {
        if ("id" in d && "type" in d) {
          if (d.id === idRef.current) {
            d.type = "END";
            d.x = Math.min(startingCoOrd.x, x);
            d.y = Math.min(startingCoOrd.y, y);
            d.w = Math.abs(startingCoOrd.x - x);
            d.h = Math.abs(startingCoOrd.y - y);
          }
        }
      });
      renderDrawings(userDrawingStore, canvas);
      idRef.current === null;

      if (roomData) {
        wsSend({
          id: idRef.current,
          type: "END",
          tool,
          userId,
          roomId: roomData.roomId,
          color,
          rectData: [
            Math.min(startingCoOrd.x, x),
            Math.min(startingCoOrd.y, y),
            Math.abs(startingCoOrd.x - x),
            Math.abs(startingCoOrd.y - y),
          ],
        });
      }
    } else if (tool === "PENCIL") {
      ctx.lineTo(x, y);
      ctx.stroke();
      const coOrdinate: CoOrdinateObject = { x, y };
      addInPencilLineSegmentCollection({
        id: idRef.current,
        type: "END",
        coOrdinate,
        color,
      });
      userDrawingStore.push(collectionOfPencilLineSegment.current);
      if (roomData) {
        wsSend({
          id: idRef.current,
          type: "END",
          tool,
          userId,
          roomId: roomData.roomId,
          color,
          coOrdinate,
        });
        wsSend({
          id: idRef.current,
          userId,
          roomId: roomData.roomId,
          type: "PENCIL-COLLECTION",
          collectionOfPencilLineSegment: collectionOfPencilLineSegment.current,
        });
      }
    }
    isMoveRef.current = false;
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block bg-black"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
      />
      <Room wsc={wsc} userId={userId} />
    </div>
  );
}

export default Canvas;

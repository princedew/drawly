import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../store/store";
import Room from "../components/Room";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { type DrawingColor } from "../store/store";
import { DRAWING_COLORS } from "../utils/utils";

type CoOrdinateObject = {
  x: number;
  y: number;
};

type Tool = "PENCIL" | "RECTANGLE";

type EventType = "START-COORDINATE" | "MOVING-COORDINATE" | "END-COORDINATE";
type RectDataTuple = [number, number, number, number];

type PencilDataType = {
  type: EventType;
  tool: Tool;
  userId: number;
  color: DrawingColor;
  coOrdinate: CoOrdinateObject;
  collectionOfPencilLineSegment?: PencilDataType[];
};

type RectDataType = {
  type: EventType;
  tool: Tool;
  userId: number;
  color: DrawingColor;
  rectData: RectDataTuple;
};

type UserRectDataType = {
  type: EventType;
  tool: Tool;
  userId: number;
  color: DrawingColor;
  usersRect: Record<string, number>[];
};

const prevCoOrdForLineRendering = new Map<number, CoOrdinateObject>();
const prevRectForRendering = new Map<number, RectDataTuple>();

function Canvas() {
  const navigate = useNavigate();

  const tool = useStore((state) => state.tool);
  const color = useStore((state) => state.color);
  const userId = useStore((state) => state.userId);
  const roomData = useStore((state) => state.roomData);

  const [canMove, setCanMove] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rectStartingCoOrdinate = useRef<CoOrdinateObject | null>(null);
  const collectionOfPencilLineSegment = useRef<PencilDataType[] | []>([]);

  const rectImage = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
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
        if (data.tool === "RECTANGLE") {
          renderRectangle(data);
        }
        if (data.tool === "PENCIL") {
          renderPencilDrawing(data);
        }
        if (data.type === "PREV-DRAWING") {
          console.log("PREV-DATA :", data);
          renderPrevRectDrawing(data.roomDrawingObj.rectangleDrawing);
          renderPrevPencilDrawing(data.roomDrawingObj.pencilDrawing);
        }
      };

      // ----------------------
      //  RENDERING DRAWING TO THE MID JOIN USER IN THE ROOM. 
      // ----------------------
      function renderPrevPencilDrawing(
        arrayOfPencilLineSegCollection: PencilDataType[][],
      ) {
        if (
          !Array.isArray(arrayOfPencilLineSegCollection) ||
          arrayOfPencilLineSegCollection.length === 0
        )
          return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.lineWidth = 2;
        const prevCoOrdinateForRendering = new Map<number, CoOrdinateObject>();

        for (const collection of arrayOfPencilLineSegCollection) {
          for (const partOfLineSegment of collection) {
            const colorKey = partOfLineSegment.color as DrawingColor;
            const strokeColor = DRAWING_COLORS[colorKey] ?? DRAWING_COLORS.GRAY;
            ctx.strokeStyle = strokeColor;

            if (partOfLineSegment.type === "START-COORDINATE") {
              ctx.beginPath();
              ctx.moveTo(
                partOfLineSegment.coOrdinate.x,
                partOfLineSegment.coOrdinate.y,
              );
              prevCoOrdinateForRendering.set(partOfLineSegment.userId, {
                x: partOfLineSegment.coOrdinate.x,
                y: partOfLineSegment.coOrdinate.y,
              });
            } else if (partOfLineSegment.type === "MOVING-COORDINATE") {
              const prevCoOrdinate = prevCoOrdinateForRendering.get(
                partOfLineSegment.userId,
              );
              if (!prevCoOrdinate) continue;
              ctx.lineTo(
                partOfLineSegment.coOrdinate.x,
                partOfLineSegment.coOrdinate.y,
              );
              prevCoOrdinateForRendering.set(partOfLineSegment.userId, {
                x: partOfLineSegment.coOrdinate.x,
                y: partOfLineSegment.coOrdinate.y,
              });
              ctx.stroke();
            } else if (partOfLineSegment.type === "END-COORDINATE") {
              prevCoOrdinateForRendering.delete(partOfLineSegment.userId);
            }
          }
        }
        console.log(`Rendered  previous pencil segments`);
      }
      function renderPrevRectDrawing(data: {
        roomId: number;
        roomDrawing: {
          x: number;
          y: number;
          w: number;
          h: number;
          color: string;
        }[];
      }) {
        console.log("PREV-DATA :", data);
        const roomData = useStore.getState().roomData;
        if (!roomData) {
          console.log("> ROOM-DATA:", roomData);
          return;
        }
        if (data.roomId === roomData.roomId) {
          console.log("PREV-DATA :", 1);
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const drawings = data.roomDrawing;
          if (!Array.isArray(drawings) || drawings.length === 0) {
            console.log("No previous drawings to render");
            return;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 2;

          console.log("PREV-DATA :", 1);
          for (const drawing of drawings) {
            console.log("PREV-DATA :", 1);
            const colorKey = drawing.color as DrawingColor;
            const strokeColor = DRAWING_COLORS[colorKey] ?? DRAWING_COLORS.GRAY;
            ctx.strokeStyle = strokeColor;
            ctx.strokeRect(drawing.x, drawing.y, drawing.w, drawing.h);
          }
          console.log(`Rendered ${drawings.length} previous drawings`);
        }
      }

      // ----------------------
      //  RENDERING ROOM'S BROADCASTED DRAWING IN THE CANVAS.
      // ----------------------
      function renderRectangle(data: RectDataType | UserRectDataType) {
        console.log("RENDER-DATA:", data);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.strokeStyle = DRAWING_COLORS[data.color as DrawingColor];
        ctx.lineWidth = 2;
        if (data.type === "START-COORDINATE" && "rectData" in data) {
          let x = data.rectData[0];
          let y = data.rectData[1];
          let w = data.rectData[2];
          let h = data.rectData[3];
          ctx.strokeRect(x, y, w, h);
          prevRectForRendering.set(data.userId, [x, y, w, h]);
        } else if (data.type === "MOVING-COORDINATE" && "rectData" in data) {
          const temp = prevRectForRendering.get(data.userId);
          if (!temp) {
            return;
          }
          const [prev_x, prev_y, prev_w, prev_h] = temp;

          let x = data.rectData[0];
          let y = data.rectData[1];
          let w = data.rectData[2];
          let h = data.rectData[3];
          ctx.clearRect(prev_x - 2, prev_y - 2, prev_w + 6, prev_h + 6);
          ctx.strokeRect(x, y, w, h);
          prevRectForRendering.set(data.userId, [x, y, w, h]);
        } else if (data.type === "END-COORDINATE") {
        }
      }
      function renderPencilDrawing(data: PencilDataType) {
        console.log("RENDER-DATA:", data);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.strokeStyle = DRAWING_COLORS[data.color as DrawingColor];
        ctx.lineWidth = 2;

        if (data.type === "START-COORDINATE") {
          ctx.beginPath();
          ctx.moveTo(data.coOrdinate.x, data.coOrdinate.y);
          prevCoOrdForLineRendering.set(data.userId, {
            x: data.coOrdinate.x,
            y: data.coOrdinate.y,
          });
        } else if (data.type === "MOVING-COORDINATE") {
          const prevCoOrdinate = prevCoOrdForLineRendering.get(data.userId);
          if (!prevCoOrdinate) {
            return;
          }
          ctx.lineTo(data.coOrdinate.x, data.coOrdinate.y);
          prevCoOrdForLineRendering.set(data.userId, {
            x: data.coOrdinate.x,
            y: data.coOrdinate.y,
          });
          ctx.stroke();
        } else if (data.type === "END-COORDINATE") {
          prevCoOrdForLineRendering.delete(data.userId);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log("ERROR:", error.message);
      } else {
        console.log("ERROR:", error);
      }
    }
  }, [wsc, userId]);

  function wsSend(data: PencilDataType | RectDataType | UserRectDataType) {
    if (wsc && userId !== null && wsc.readyState === WebSocket.OPEN) {
      wsc.send(JSON.stringify({ ...data, roomId: roomData?.roomId ?? null }));
    }
  }
  function addInPencilLineSegmentCollection(data) {
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

      if (tool === "RECTANGLE") {
        ctx.strokeStyle = DRAWING_COLORS[color];
        ctx.lineWidth = 2;
        rectStartingCoOrdinate.current = { x, y };

        rectImage.current = { x, y, w: 0, h: 0 };
        wsSend({
          type: "START-COORDINATE",
          tool,
          userId,
          color,
          rectData: [x, y, 0, 0],
        });
      } else if (tool === "PENCIL") {
        ctx.beginPath();
        ctx.moveTo(x, y);
        const coOrdinate: CoOrdinateObject = { x, y };
        addInPencilLineSegmentCollection({
          type: "START-COORDINATE",
          tool,
          userId,
          color,
          coOrdinate,
        });
        wsSend({ type: "START-COORDINATE", tool, userId, color, coOrdinate });
      }
      setCanMove(true);
    } catch (error) {
      console.log("\n> ERROR [fn start()]: ", error);
    }
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (userId === null) return;
    try {
      if (!canMove) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;

      if (tool === "RECTANGLE") {
        const startingCoOrd = rectStartingCoOrdinate.current;
        if (!startingCoOrd) return;

        const startX = Math.min(startingCoOrd.x, x);
        const startY = Math.min(startingCoOrd.y, y);

        const w = Math.abs(startingCoOrd.x - x);
        const h = Math.abs(startingCoOrd.y - y);

        const prevCoOrd = rectImage.current;
        if (!prevCoOrd) {
          return;
        }

        ctx.clearRect(
          prevCoOrd.x - 2,
          prevCoOrd.y - 2,
          prevCoOrd.w + 6,
          prevCoOrd.h + 6,
        );

        ctx.strokeRect(startX, startY, w, h);
        rectImage.current = { x: startX, y: startY, w, h };

        wsSend({
          type: "MOVING-COORDINATE",
          tool,
          userId,
          color,
          rectData: [startX, startY, w, h],
        });
      } else if (tool === "PENCIL") {
        ctx.strokeStyle = DRAWING_COLORS[color];
        ctx.lineTo(x, y);
        ctx.stroke();
        const coOrdinate: CoOrdinateObject = { x, y };
        addInPencilLineSegmentCollection({
          type: "MOVING-COORDINATE",
          tool,
          userId,
          color,
          coOrdinate,
        });
        wsSend({ type: "MOVING-COORDINATE", tool, userId, color, coOrdinate });
      }
    } catch (error) {
      console.log("\n> ERROR [fn move()] : ", error);
    }
  };

  const end = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (userId === null) return;
    setCanMove(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x: number = e.clientX - rect.left;
    const y: number = e.clientY - rect.top;

    if (tool === "RECTANGLE") {
      if (!rectImage.current) {
        return;
      }
      wsSend({
        type: "END-COORDINATE",
        tool,
        userId,
        color,
        rectData: [
          rectImage.current.x,
          rectImage.current.y,
          rectImage.current.w,
          rectImage.current.h,
        ],
      });
      rectImage.current = null;
    } else if (tool === "PENCIL") {
      ctx.lineTo(x, y);
      ctx.stroke();
      const coOrdinate: CoOrdinateObject = { x, y };
      addInPencilLineSegmentCollection({
        type: "END-COORDINATE",
        tool,
        userId,
        color,
        coOrdinate,
      });
      wsSend({
        type: "END-COORDINATE",
        tool,
        userId,
        color,
        coOrdinate,
        collectionOfPencilLineSegment: collectionOfPencilLineSegment.current,
      });
    }
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

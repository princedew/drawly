import React, { useEffect, useRef, useState } from "react";
import { useStore, type DrawingColor } from "../store/store";
import Room from "../components/Room";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useRender } from "../hooks/useRender";

import { DRAWING_COLORS } from "../utils/utils";

export const TOOL = {
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
};

type Tool = keyof typeof TOOL;

type MouseEventType = "MOVING" | "START" | "END";

type CoOrdinateObject = { x: number; y: number };

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
  const { renderDrawings } = useRender();

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
  // useEffect(() => {
  //   if (!wsc || userId === null) return;

  //   try {
  //     wsc.onmessage = async (msg) => {
  //       const data = JSON.parse(msg.data);
  //       // console.log("PARSE-DATA:", data);
  //       if (data.userId === userId) return;
  //       if (data.tool === "RECTANGLE") {
  //         renderRectangle(data);
  //       }
  //       if (data.tool === "PENCIL") {
  //         renderPencilDrawing(data);
  //       }
  //       if (data.type === "PREV-DRAWING") {
  //         console.log("PREV-DATA :", data);
  //         renderPrevRectDrawing(data.roomDrawingObj.rectangleDrawing);
  //         renderPrevPencilDrawing(data.roomDrawingObj.pencilDrawing);
  //       }
  //     };
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       console.log("ERROR:", error.message);
  //     } else {
  //       console.log("ERROR:", error);
  //     }
  //   }
  // }, [wsc, userId]);

  // -----------------------
  // RENDERING THE PREV/ EXISTING ROOM DRAWING, FEAT: FOR MID JOIN USER GET THE ALREADY DRAWN
  // -----------------------
  // function renderPrevPencilDrawing(
  //   arrayOfPencilLineSegCollection: PencilDataType[][],
  // ) {
  //   if (
  //     !Array.isArray(arrayOfPencilLineSegCollection) ||
  //     arrayOfPencilLineSegCollection.length === 0
  //   )
  //     return;

  //   const canvas = canvasRef.current;
  //   if (!canvas) return;
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   ctx.lineWidth = 2;

  //   for (const collection of arrayOfPencilLineSegCollection) {
  //     for (const partOfLineSegment of collection) {
  //       const color = partOfLineSegment.color as DrawingColor;
  //       const strokeColor = DRAWING_COLORS[color] ?? DRAWING_COLORS.GRAY;
  //       ctx.strokeStyle = strokeColor;

  //       if (partOfLineSegment.type === "START-COORDINATE") {
  //         ctx.beginPath();
  //         ctx.moveTo(
  //           partOfLineSegment.coOrdinate.x,
  //           partOfLineSegment.coOrdinate.y,
  //         );
  //         prevCoOrdForLineRendering.set(partOfLineSegment.userId, {
  //           x: partOfLineSegment.coOrdinate.x,
  //           y: partOfLineSegment.coOrdinate.y,
  //         });
  //       } else if (partOfLineSegment.type === "MOVING-COORDINATE") {
  //         const prevCoOrdinate = prevCoOrdForLineRendering.get(
  //           partOfLineSegment.userId,
  //         );
  //         if (!prevCoOrdinate) continue;
  //         ctx.moveTo(prevCoOrdinate.x, prevCoOrdinate.y);
  //         ctx.lineTo(
  //           partOfLineSegment.coOrdinate.x,
  //           partOfLineSegment.coOrdinate.y,
  //         );
  //         prevCoOrdForLineRendering.set(partOfLineSegment.userId, {
  //           x: partOfLineSegment.coOrdinate.x,
  //           y: partOfLineSegment.coOrdinate.y,
  //         });
  //         ctx.stroke();
  //       } else if (partOfLineSegment.type === "END-COORDINATE") {
  //         prevCoOrdForLineRendering.delete(partOfLineSegment.userId);
  //       }
  //     }
  //   }
  //   console.log(`Rendered  previous pencil segments`);
  // }
  // function renderPrevRectDrawing(data: {
  //   roomId: number;
  //   roomDrawing: {
  //     x: number;
  //     y: number;
  //     w: number;
  //     h: number;
  //     color: string;
  //   }[];
  // }) {
  //   console.log("PREV-DATA :", data);
  //   const roomData = useStore.getState().roomData;
  //   if (!roomData) {
  //     console.log("> ROOM-DATA:", roomData);
  //     return;
  //   }
  //   if (data.roomId === roomData.roomId) {
  //     console.log("PREV-DATA :", 1);
  //     const canvas = canvasRef.current;
  //     if (!canvas) return;
  //     const ctx = canvas.getContext("2d");
  //     if (!ctx) return;

  //     const drawings = data.roomDrawing;
  //     if (!Array.isArray(drawings) || drawings.length === 0) {
  //       console.log("No previous drawings to render");
  //       return;
  //     }

  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //     ctx.lineWidth = 2;

  //     console.log("PREV-DATA :", 1);
  //     for (const drawing of drawings) {
  //       console.log("PREV-DATA :", 1);
  //       const colorKey = drawing.color as DrawingColor;
  //       const strokeColor = DRAWING_COLORS[colorKey] ?? DRAWING_COLORS.GRAY;
  //       ctx.strokeStyle = strokeColor;
  //       ctx.strokeRect(drawing.x, drawing.y, drawing.w, drawing.h);
  //     }
  //     console.log(`Rendered ${drawings.length} previous drawings`);
  //   }
  // }

  // -----------------------
  // RENDERING THE BROADCASTED DRAWINGS
  // -----------------------
  // function renderRectangle(data: RectDataType | UserRectDataType) {
  //   console.log("RENDER-DATA:", data);
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;
  //   ctx.strokeStyle = DRAWING_COLORS[data.color as DrawingColor];
  //   ctx.lineWidth = 2;
  //   if (data.type === "START-COORDINATE" && "rectData" in data) {
  //     let x = data.rectData[0];
  //     let y = data.rectData[1];
  //     let w = data.rectData[2];
  //     let h = data.rectData[3];
  //     ctx.strokeRect(x, y, w, h);
  //     prevRectForRendering.set(data.userId, [x, y, w, h]);
  //   } else if (data.type === "MOVING-COORDINATE" && "rectData" in data) {
  //     const temp = prevRectForRendering.get(data.userId);
  //     if (!temp) {
  //       return;
  //     }
  //     const [prev_x, prev_y, prev_w, prev_h] = temp;

  //     let x = data.rectData[0];
  //     let y = data.rectData[1];
  //     let w = data.rectData[2];
  //     let h = data.rectData[3];
  //     ctx.clearRect(prev_x - 2, prev_y - 2, prev_w + 6, prev_h + 6);
  //     ctx.strokeRect(x, y, w, h);
  //     prevRectForRendering.set(data.userId, [x, y, w, h]);
  //   } else if (data.type === "END-COORDINATE") {
  //   }
  // }
  // function renderPencilDrawing(data: PencilDataType) {
  //   console.log("RENDER-DATA:", data);
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   ctx.strokeStyle = DRAWING_COLORS[data.color as DrawingColor];
  //   ctx.lineWidth = 2;

  //   if (data.type === "START-COORDINATE") {
  //     ctx.beginPath();
  //     ctx.moveTo(data.coOrdinate.x, data.coOrdinate.y);
  //     prevCoOrdForLineRendering.set(data.userId, {
  //       x: data.coOrdinate.x,
  //       y: data.coOrdinate.y,
  //     });
  //   } else if (data.type === "MOVING-COORDINATE") {
  //     const prevCoOrdinate = prevCoOrdForLineRendering.get(data.userId);
  //     if (!prevCoOrdinate) {
  //       return;
  //     }
  //     ctx.moveTo(prevCoOrdinate.x, prevCoOrdinate.y);
  //     ctx.lineTo(data.coOrdinate.x, data.coOrdinate.y);
  //     prevCoOrdForLineRendering.set(data.userId, {
  //       x: data.coOrdinate.x,
  //       y: data.coOrdinate.y,
  //     });
  //     ctx.stroke();
  //   } else if (data.type === "END-COORDINATE") {
  //     prevCoOrdForLineRendering.delete(data.userId);
  //   }
  // }

  // -----------------------
  // RENDERING THE DRAWINGS BEFORE RENDERING CURRENT RECT.
  // -----------------------
  // function renderFromUserDrawingStore(
  //   drawings: Array<RectDataType | PencilDataType[]>,
  // ) {
  //   if (!drawings) {
  //     console.log("drawing is undefined");
  //     return;
  //   }
  //   if (drawings.length === 0) {
  //     console.log("No drawing in user Drawing store.");
  //     return;
  //   }
  //   console.log("DRAWINGS:", drawings);

  //   const canvas = canvasRef.current;
  //   if (!canvas) return;
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   ctx.lineWidth = 2;

  //   for (const drawing of drawings) {
  //     if (Array.isArray(drawing) && drawing[0].tool === "PENCIL") {
  //       for (let i = 0; i < drawings.length; i++) {
  //         const partOfLine = drawings[i];
  //         const colorKey = partOfLine.color as DrawingColor;
  //         ctx.strokeStyle = DRAWING_COLORS[colorKey] ?? DRAWING_COLORS.GRAY;

  //         if (partOfLine.type === "START-COORDINATE") {
  //           ctx.beginPath();
  //           ctx.moveTo(partOfLine.coOrdinate.x, partOfLine.coOrdinate.y);
  //         } else if (partOfLine.type === "MOVING-COORDINATE") {
  //           const prevPart = partOfLine[i - 1];
  //           if (prevPart && prevPart.type !== "END-COORDINATE") {
  //             ctx.lineTo(partOfLine.coOrdinate.x, partOfLine.coOrdinate.y);
  //             ctx.stroke();
  //           }
  //         }
  //       }
  //     } else {
  //       if ((drawing.tool = "RECTANGLE")) {
  //         const [x, y, w, h] = drawing.rectData;
  //         const colorKey = drawing.color as DrawingColor;
  //         ctx.strokeStyle = DRAWING_COLORS[colorKey] ?? DRAWING_COLORS.GRAY;
  //         ctx.strokeRect(x, y, w, h);
  //       }
  //     }
  //   }
  // }

  // function wsSend(data: PencilDataType | RectDataType) {
  //   if (wsc && userId !== null && wsc.readyState === WebSocket.OPEN) {
  //     wsc.send(JSON.stringify({ ...data, roomId: roomData?.roomId ?? null }));
  //   }
  // }
  // function addDrawingIntoStoreMap(
  //   userId: number,
  //   data: RectDataType | PencilDataType[],
  // ) {
  //   let drawings = userDrawingStore.get(userId);
  //   if (!drawings) {
  //     drawings = { rectDrawing: [], pencilDrawing: [] };
  //   }
  //   if (Array.isArray(data)) {
  //     drawings.pencilDrawing.push(data);
  //   } else {
  //     switch (data.tool) {
  //       case "RECTANGLE":
  //         drawings.rectDrawing.push(data);
  //         break;
  //       default:
  //         break;
  //     }
  //   }
  // }

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

        // wsSend({
        //   type: "START-COORDINATE",
        //   tool,
        //   userId,
        //   color,
        //   rectData: [x, y, 0, 0],
        // });
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
        // wsSend({ type: "START-COORDINATE", tool, userId, color, coOrdinate });
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

        // >> FROM HERE TO,
        // const prevCoOrd = rectImage.current;
        // if (!prevCoOrd) {
        //   return;
        // }

        // ctx.clearRect(
        //   prevCoOrd.x - 2,
        //   prevCoOrd.y - 2,
        //   prevCoOrd.w + 6,
        //   prevCoOrd.h + 6,
        // );
        // >> HERE THE

        // ctx.strokeRect(startX, startY, w, h);
        // rectImage.current = { x: startX, y: startY, w, h };

        // if (movingEventCountRef.current > 1) {
        //   userDrawingStore.pop();
        // }

        // wsSend({
        //   type: "MOVING-COORDINATE",
        //   tool,
        //   userId,
        //   color,
        //   rectData: [startX, startY, w, h],
        // });
        // movingEventCountRef.current += 1;
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

        // wsSend({ type: "MOVING-COORDINATE", tool, userId, color, coOrdinate });
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

      // if (!rectImage.current) {
      //   return;
      // }
      // const rectData: RectDataTuple = [
      //   rectImage.current.x,
      //   rectImage.current.y,
      //   rectImage.current.w,
      //   rectImage.current.h,
      // ];

      // addDrawingIntoStoreMap(userId, {
      //   type: "END-COORDINATE",
      //   tool,
      //   userId,
      //   color,
      //   rectData,
      // });

      // wsSend({
      //   type: "END-COORDINATE",
      //   tool,
      //   userId,
      //   color,
      //   rectData,
      // });
      // rectImage.current = null;
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
      // wsSend({
      //   type: "END-COORDINATE",
      //   tool,
      //   userId,
      //   color,
      //   coOrdinate,
      //   collectionOfPencilLineSegment: collectionOfPencilLineSegment.current,
      // });
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

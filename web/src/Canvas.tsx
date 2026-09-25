import React, { useRef, useState } from "react";

type CoOrdinateObject = {
  x: number;
  y: number;
};

type Tool = "PENCIL" | "RECTANGLE";

type RenderDataType = {
  type: string;
  tool: Tool;
  userId: string;
  coOrdinate: CoOrdinateObject;
};

type RectDataType = {
  type: string;
  tool: Tool;
  userId: string;
  rectData: [number, number, number, number];
};

type UserRectDataType = {
  type: string;
  tool: Tool;
  userId: string;
  usersRect: LastRect[];
};

type LastRect = {
  x: number;
  y: number;
};

const prevCoOrdinateStore = new Map<string, CoOrdinateObject | LastRect>();
const prevRectForRendering = new Map<
  string,
  [number, number, number, number]
>();

function Canvas({ wsc, userId }: { wsc: WebSocket; userId: string }) {
  const [tool, setTool] = useState<Tool>(
    "PENCIL",
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canMove, setCanMove] = useState<boolean>(false);

  const [usersRect, setUsersRect] = useState<LastRect[]>([]);
  const rectStartingCoOrdinate = useRef<CoOrdinateObject | null>(null);

  wsc.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    // console.log("PARSE-DATA:", data);
    if (data.userId === userId) return;
    if (data.tool === "RECTANGLE") {
      renderRectangle(data);
    }
    if (data.tool === "PENCIL") {
      renderPencilDrawing(data);
    }
  };

  function renderRectangle(data: RectDataType | UserRectDataType) {
    console.log("RENDER-DATA:", data);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    if (data.type === "START-COORDINATE") {
      let x = data.rectData[0];
      let y = data.rectData[1];
      let w = data.rectData[2];
      let h = data.rectData[3];
      ctx.strokeRect(x, y, w, h);
      prevRectForRendering.set(data.userId, [x, y, w, h]);
    } else if (data.type === "MOVING-COORDINATE") {
      const [prev_x, prev_y, prev_w, prev_h] = prevRectForRendering.get(data.userId);
      let x = data.rectData[0];
      let y = data.rectData[1];
      let w = data.rectData[2];
      let h = data.rectData[3];
      ctx.clearRect(prev_x-2, prev_y-2, prev_w+6, prev_h+6);
      ctx.strokeRect(x, y, w, h);
      prevRectForRendering.set(data.userId, [x, y, w, h]);
    } else if (data.type === "END-COORDINATE") {
    }
  }

  function renderPencilDrawing(data: RenderDataType) {
    console.log("RENDER-DATA:", data);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    if (data.type === "START-COORDINATE") {
      ctx.beginPath();
      ctx.moveTo(data.coOrdinate.x, data.coOrdinate.y);
      prevCoOrdinateStore.set(data.userId, {
        x: data.coOrdinate.x,
        y: data.coOrdinate.y,
      });
    } else if (data.type === "MOVING-COORDINATE") {
      const prevCoOrdinate = prevCoOrdinateStore.get(data.userId);
      if (!prevCoOrdinate) {
        return;
      }
      ctx.lineTo(data.coOrdinate.x, data.coOrdinate.y);
      prevCoOrdinateStore.set(data.userId, {
        x: data.coOrdinate.x,
        y: data.coOrdinate.y,
      });
      ctx.stroke();
    } else if (data.type === "END-COORDINATE") {
      prevCoOrdinateStore.delete(data.userId);
    }
  }

  function wsSend(data: RenderDataType | RectDataType | UserRectDataType) {
    if (!wsc) {
      console.log("wsc:", wsc);
      return;
    }
    if (wsc.readyState === wsc.OPEN) {
      wsc.send(JSON.stringify(data));
    }
  }

  const start = (e: React.MouseEvent<HTMLCanvasElement>) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;

      ctx.strokeStyle = "gray";

      
      if (tool === "RECTANGLE") {
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        rectStartingCoOrdinate.current = { x, y };
        prevCoOrdinateStore.set("RECTANGLE", { x, y, w: 0, h: 0 });
        wsSend({
          type: "START-COORDINATE",
          tool,
          userId,
          rectData: [x, y, 0, 0],
        });
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        const coOrdinate: CoOrdinateObject = { x, y };
        wsSend({ type: "START-COORDINATE", tool, userId, coOrdinate });
      }
      setCanMove(true);
    } catch (error) {
      console.log("\n> ERROR [fn start()]: ", error);
    }
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement>) => {
    try {
      if (!canMove) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;
      
      console.log("RECTANGLE move() fn");
      
      if (tool === "RECTANGLE") {
        const prevCoOrdinate = prevCoOrdinateStore.get("RECTANGLE");
        if (!prevCoOrdinate) return;
        // IN CASE OF "RECTANGLE" THE prevCoOrdinateStore STORE THE LAST RECT (X, Y, WEIDTH, HEIGHT);
        const startX = Math.min(rectStartingCoOrdinate.current.x, x);
        const startY = Math.min(rectStartingCoOrdinate.current.y, y);

        const w = Math.abs(rectStartingCoOrdinate.current.x - x);
        const h = Math.abs(rectStartingCoOrdinate.current.y - y);

        ctx.clearRect(
          prevCoOrdinate.x - 2,
          prevCoOrdinate.y - 2,
          prevCoOrdinate.w + 6,
          prevCoOrdinate.h + 6,
        );

        ctx.strokeRect(startX, startY, w, h);
        prevCoOrdinateStore.set("RECTANGLE", {
          x: startX,
          y: startY,
          w,
          h,
        });

        wsSend({
          type: "MOVING-COORDINATE",
          tool,
          userId,
          rectData: [startX, startY, w, h],
        });
      } else if (tool === "PENCIL") {
        console.log("move ws evnt going");
        ctx.lineTo(x, y);
        ctx.stroke();
        const coOrdinate: CoOrdinateObject = { x, y };
        wsSend({ type: "MOVING-COORDINATE", tool, userId, coOrdinate });
      }
    } catch (error) {
      console.log("\n> ERROR [fn move()] : ", error);
    }
  };

  const end = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setCanMove(false);

    prevCoOrdinateStore.delete(userId);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x: number = e.clientX - rect.left;
    const y: number = e.clientY - rect.top;

    if (tool === "RECTANGLE") {
      setUsersRect((prev) => {
        return [...prev, prevCoOrdinateStore.get("RECTANGLE")];
      });
      wsSend({ type: "END-COORDINATE", tool, userId, usersRect });
    } else if (tool === "PENCIL") {
      ctx.lineTo(x, y);
      ctx.stroke();
      const coOrdinate: CoOrdinateObject = { x, y };

      wsSend({ type: "END-COORDINATE", tool, userId, coOrdinate });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="bg-black"
      onMouseDown={start}
      onMouseMove={move}
      onMouseUp={end}
    ></canvas>
  );
}

export default Canvas;

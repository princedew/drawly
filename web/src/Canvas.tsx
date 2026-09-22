import { useRef, useState } from "react";

export const drawing = new Map<string, any>();

function Canvas({ wsc, userId }: { wsc: WebSocket; userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canMove, setCanMove] = useState<boolean>(false);

  const [line, setLine] = useState<Record<string, number | null>>({
    startX: null,
    startY: null,
    endX: null,
    endY: null,
  });


  wsc.onmessage = (msg) => {
    // console.log("ln 15 msg :", msg);
    const data = JSON.parse(msg.data);
    if (
      data.type === "LINE-INFO" &&
      data.line.startX !== null &&
      data.line.startY !== null &&
      data.line.endX !== null &&
      data.line.endY !== null
    ) {
      // console.log("> BRODECASTED LINE DATA :", data.line);
      render(data);
    }
  };
  
  function render(data) {
    console.log("RENDER-DATA:", data);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (data.isStart) {
      ctx.beginPath();
      ctx.moveTo(data.line.startX, data.line.startY);
    } else {
      // ctx.beginPath();
      ctx.beginPath();
      ctx.moveTo(data.line.startX, data.line.startY);
      ctx.lineTo(data.line.endX, data.line.endY);
      ctx.stroke();
    }
  }

  const start = (e: any) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = "gray";
      ctx.beginPath();

      const rect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;

      ctx.moveTo(x, y);

      setLine({ startX: x, startY: y, endX: null, endY: null });

      if (wsc?.readyState === wsc?.OPEN) {
        wsc?.send(
          JSON.stringify({
            type: "LINE-INFO",
            isStart: true,
            isEnd: false,
            userId: userId,
            line: line,
          }),
        );
      }
      setCanMove(true);
    } catch (error) {
      console.log("\n> ERROR: ", error);
    }
  };

  const move = (e: any) => {
    try {
      if (!canMove) {
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;
      ctx.lineTo(x, y);
      setLine((prev) => {
        if (prev.endX === null && prev.endY === null) {
          return {startX: prev.startX, startY: prev.startY, endX:x, endY:y};
        }
        return {
          startX: prev.endX,
          startY: prev.endY,
          endX: x,
          endY: y,
        };
      });

      console.log("LINE:", line);
      if (wsc?.readyState === wsc?.OPEN) {
        wsc?.send(
          JSON.stringify({
            type: "LINE-INFO",
            isStart: false,
            isEnd: false,
            userId: userId,
            line: line,
          }),
        );
      }
      ctx.stroke();
    } catch (error) {
      console.log("\n> ERROR: ", error);
    }
  };

  const end = () => {
    setCanMove(false);
    if (wsc?.readyState === wsc?.OPEN) {
      wsc?.send(
        JSON.stringify({
          type: "LINE-INFO",
          isStart: false,
          isEnd: true,
          userId: userId,
          line: line,
        }),
      );
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

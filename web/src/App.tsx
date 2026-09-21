import { useRef, useState } from "react";

function App({ wsc: wsc }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canMove, setCanMove] = useState<boolean>(false);

  const [line, setLine] = useState<Record<string, number | null>>({
    startX: null,
    startY: null,
    endX: null,
    endY: null,
  });

  wsc.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (
      data.type === "LINE-INFO" &&
      data.line.startX !== null &&
      data.line.startY !== null &&
      data.line.endX !== null &&
      data.line.endY !== null
    ) {
      // console.log("> BRODECASTED LINE DATA :", data.line);
      // ctx.beginPath();
      // ctx.moveTo();
    }
  };

  const start = (e: React.MouseEvent<HTMLCanvasElement>) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = "gray";
      ctx.beginPath();

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.moveTo(x, y);

      setLine({ startX: x, startY: y, endX: null, endY: null });

      if (wsc?.readyState === wsc?.OPEN) {
        wsc?.send(JSON.stringify({ type: "LINE-INFO", line: line }));
      }
      setCanMove(true);
    } catch (error) {
      console.log("\n> ERROR: ", error);
    }
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement>) => {
    try {
      if (!canMove) {
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.lineTo(x, y);
      setLine((prev) => {
        if (prev.endX === null && prev.endY === null) {
          return { startX: prev.startX, startY: prev.startY, endX: x, endY: y };
        }
        return { startX: prev.endX, startY: prev.endY, endX: x, endY: y };
      });

      console.log("LINE:", line);
      if (wsc?.readyState === wsc?.OPEN) {
        wsc?.send(JSON.stringify({ type: "LINE-INFO", line: line }));
      }
      ctx.stroke();
    } catch (error) {
      console.log("\n> ERROR: ", error);
    }
  };

  const end = () => {
    setCanMove(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{ backgroundColor: "black" }}
      onMouseDown={start}
      onMouseMove={move}
      onMouseUp={end}
    ></canvas>
  );
}

export default App;

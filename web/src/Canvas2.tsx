import { useRef, useState } from "react";

function Canvas2({ wsc, userId }: { wsc: WebSocket; userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canMove, setCanMove] = useState<boolean>(false);

  type line = {
    x: number | null;
    y: number | null;
  };
  const [lineRecord, setLineRecord] = useState<line[]>([]);

  wsc.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    render(data);
  };

  function render(data) {
    console.log("RENDER-DATA:", data);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (data.type === "LINE-RECORD") {
      console.log("beginpathcalled");
      ctx.beginPath();
      console.log("begin path ended");
      data.lineRecord.forEach((lineObj, idx) => {
        if (idx === 0) {
          console.log("0 index move to called");
          ctx.moveTo(lineObj.x, lineObj.y);
          console.log("move to ended");
        }else{
          ctx.strokeStyle = "orange"; 
          ctx.lineWidth = 2;
          ctx.lineTo(lineObj.x, lineObj.y);
        }
      });
      ctx.stroke();
    }
  }

  function checkPoint(data) {
    if (
      data.startX === null ||
      data.startY === null ||
      data.endX === null ||
      data.endY === null
    ) {
      return false;
    }
    return true;
  }

  function wsSendJson(data) {
    if (!wsc) {
      console.log("wsc:", wsc);
      return;
    }
    if (wsc.readyState === wsc.OPEN) {
      wsc.send(JSON.stringify(data));
    }
  }

  const start = (e: any) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;

      ctx.strokeStyle = "gray";
      ctx.beginPath();
      ctx.moveTo(x, y);

      const newLine = { x, y };

      setLineRecord((prev) => [...prev, newLine]);

      setCanMove(true);
    } catch (error) {
      console.log("\n> ERROR [fn start()]: ", error);
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
      ctx.stroke();
      const newLine = {
        x: x,
        y: y,
      };

      setLineRecord((prev) => [...prev, newLine]);
    } catch (error) {
      console.log("\n> ERROR [fn move()] : ", error);
    }
  };

  const end = () => {
    setCanMove(false);
    console.log("LINE-RECORD :", lineRecord);

    if (wsc?.readyState === wsc?.OPEN) {
      wsc?.send(
        JSON.stringify({
          type: "LINE-RECORD",
          userId: userId,
          lineRecord: lineRecord,
        }),
      );
      setLineRecord([])
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

export default Canvas2;




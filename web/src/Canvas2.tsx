import React, { useRef, useState } from "react";

type line = {
  x: number | null;
  y: number | null;
};

const prevCoOrdinateStore = new Map<string, {x:number, y:number}>();

function Canvas2({ wsc, userId }: { wsc: WebSocket; userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canMove, setCanMove] = useState<boolean>(false);


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

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2

    if(data.type === "START-COORDINATE"){
      ctx.beginPath();
      ctx.moveTo(data.coOrdinate.x, data.coOrdinate.y);
      prevCoOrdinateStore.set(data.userId, {x:data.coOrdinate.x, y:data.coOrdinate.y});
    }else if(data.type === "MOVING-COORDINATE"){
      const prevCoOrdinate = prevCoOrdinateStore.get(data.userId);
      if (!prevCoOrdinate) {
        return;
      }
      ctx.lineTo(data.coOrdinate.x, data.coOrdinate.y);
      prevCoOrdinateStore.set(data.userId, {x:data.coOrdinate.x, y:data.coOrdinate.y});
      ctx.stroke();
    }
  }

  function wsSend(data) {
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
      ctx.beginPath();
      ctx.moveTo(x, y);

      const newLine = { x, y };

      setCanMove(true);
      wsSend({ type: "START-COORDINATE", userId, coOrdinate: newLine });
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
      ctx.lineTo(x, y);
      ctx.stroke();
      const newLine = {
        x: x,
        y: y,
      };

      wsSend({ type: "MOVING-COORDINATE", userId, coOrdinate: newLine });
    } catch (error) {
      console.log("\n> ERROR [fn move()] : ", error);
    }
  };

  const end = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setCanMove(false);
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
    wsSend({ type: "END-COORDINATE", userId, coOrdinate: newLine });
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

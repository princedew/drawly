import { useEffect, useRef, useState } from "react";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canMove, setCanMove] = useState<boolean>(false);

  const start = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.strokeStyle = "gray";
    ctx.beginPath();

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log(`x: ${x}, y: ${y}`);
    
    console.log(x, y);
    ctx.moveTo(x, y);
    setCanMove(true);
  };

  const move = (e) => {
    if (!canMove) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = (e) => {
    setCanMove(false);
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
    >
      <div className="absolute top-0 right-0">
        <p></p>
      </div>
    </canvas>
  );
}

export default App;

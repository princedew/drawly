import type { DrawingStoreItem } from "../pages/Canvas";
import type { DrawingColor } from "../store/store";
import { DRAWING_COLORS } from "../utils/utils";

export function useRender() {
  return { renderDrawings };
}

function renderDrawings(
  drawings: DrawingStoreItem[],
  canvas: HTMLCanvasElement,
) {
  if (!drawings) {
    console.log("drawing is undefined");
    return;
  }
  if (drawings.length === 0) {
    console.log("No drawing in user Drawing store.");
    return;
  }
  if (!canvas) {
    console.log("No canvas in useRender hook.");
    return;
  }
  console.log("> USE-RENDER HOOK,  DRAWINGS:", drawings);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.log("No ctx in useRender hook.");
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2;

  for (const drawing of drawings) {
    console.log("getting drawings");
    if (Array.isArray(drawing)) {
      console.log("> Rendering pencil line.");
      for (let i = 0; i < drawing.length; i++) {
        const pencilObj = drawing[i];
        const color = pencilObj.color as DrawingColor;
        ctx.strokeStyle = DRAWING_COLORS[color] ?? DRAWING_COLORS.GRAY;

        if (pencilObj.type === "START") {
          console.log("> Rendering pencil start");
          ctx.beginPath();
          ctx.moveTo(pencilObj.coOrdinate.x, pencilObj.coOrdinate.y);
        } else if (pencilObj.type === "MOVING") {
          const prevPart = drawing[i - 1];
          ctx.moveTo(prevPart.coOrdinate.x, prevPart.coOrdinate.y);
          ctx.lineTo(pencilObj.coOrdinate.x, pencilObj.coOrdinate.y);
        } else if (pencilObj.type === "END") {
          console.log("useRender hook end drawing msg");
          const prevPart = drawing[i - 1];
            ctx.moveTo(prevPart.coOrdinate.x, prevPart.coOrdinate.y);
            ctx.lineTo(pencilObj.coOrdinate.x, pencilObj.coOrdinate.y);
          ctx.stroke();
        }
      }
    } else {
      if (drawing.tool === "RECTANGLE") {
        const color = drawing.color as DrawingColor;
        ctx.strokeStyle = DRAWING_COLORS[color] ?? DRAWING_COLORS.GRAY;
        ctx.strokeRect(drawing.x, drawing.y, drawing.w, drawing.h);
      }
    }
  }
}

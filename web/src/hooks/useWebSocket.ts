import { useEffect, useState } from "react";

export function useWebSocket(userId: number | null): WebSocket | null {
  const [wsc, setWsc] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (userId === null) {
      setWsc(null);
      return;
    }

    const ws = new WebSocket("ws://localhost:8000");
    setWsc(ws);

    ws.onopen = () => {
      console.log("CONNECTED :", userId);
      ws.send(
        JSON.stringify({
          type: "FIRST-MSG",
          message: "FIRST MSG FROM CLIENT",
          userId,
        }),
      );
    };

    return () => ws.close();
  }, [userId]);

  return wsc;
}

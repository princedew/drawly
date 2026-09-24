import Canvas2 from "./Canvas2";
import { useWebSocket } from "./hooks/useWebSocket";

const App = () => {
    const userId = crypto.randomUUID();
  const wsc = useWebSocket(userId);
  return (
    <>
      <Canvas2 wsc={wsc} userId={userId}/>
    </>
  );
};

export default App;

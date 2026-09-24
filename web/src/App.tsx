import Canvas2 from "./Canvas";
import { useWebSocket } from "./hooks/useWebSocket";

const App = () => {
  const userId = crypto.randomUUID();
  const wsc = useWebSocket(userId);
  return <Canvas2 wsc={wsc} userId={userId} />;
};

export default App;

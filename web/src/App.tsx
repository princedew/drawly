import Canvas from "./Canvas";
import { useWebSocket } from "./hooks/useWebSocket";

const App = () => {
    const userId = crypto.randomUUID();
  const wsc = useWebSocket(userId);
  return (
    <>
      <Canvas wsc={wsc} userId={userId}/>
    </>
  );
};

export default App;

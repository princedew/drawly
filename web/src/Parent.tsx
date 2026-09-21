import App from "./App";
import { useWebSocket } from "./hooks/useWebSocket";

const Parent = () => {
    const userId = crypto.randomUUID();
  const wsc = useWebSocket(userId);
  return (
    <>
      <App wsc={wsc} />
    </>
  );
};

export default Parent;

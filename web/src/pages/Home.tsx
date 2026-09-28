import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store";
import { useEffect } from "react";

const Home = () => {
  const navigate = useNavigate();
  const userId = useStore((state) => state.userId);
  useEffect(() => {
    if (!userId || typeof userId !== "number") {
      navigate("/auth");
    } else {
      navigate("/draw");
    }
  }, [userId]);
};

export default Home;

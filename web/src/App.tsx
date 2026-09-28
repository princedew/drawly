import Auth from "./pages/Auth";
import Canvas from "./pages/Canvas";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

const App = () => {
 
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/draw" element={<Canvas />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./router/authRouter.js";
import roomRouter from "./router/roomRouter.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

const port = process.env.PORT || 5000;
const url = process.env.BASE_URL || "/api";

app.get("/", (req, res) => {
  res.send("server running ...");
});

app.use(express.json());
app.use(cookieParser());

app.use(url, authRouter);
app.use(url, roomRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Service running on port ${port}`);
});

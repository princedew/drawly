import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./authRouter.js";

const app = express();

const port = process.env.AUTH_PORT || 5001;
const url = process.env.BASE_URL || "/api/v1/auth"

app.get("/", (req, res) => { res.send("server running ...") })

app.use(express.json());
app.use(cookieParser());

app.use(url, authRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Auth Service running on port ${port}`);
});
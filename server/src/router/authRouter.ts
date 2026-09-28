import { Router } from "express";
import { signUp } from "../handlers/authHandlers/signup.js";
import { login } from "../handlers/authHandlers/login.js";
import { logout } from "../handlers/authHandlers/logout.js";
import { validate } from "../middleware/validateMiddleware.js";
import { loginSchema, signupSchema } from "../schema.js";

const authRouter = Router();

authRouter.post("/signup", validate(signupSchema), signUp);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", logout);

export default authRouter;

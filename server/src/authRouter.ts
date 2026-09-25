import { Router } from "express";
import { signUp } from "./authHandlers/signup.js";
import { login } from "./authHandlers/login.js";
import { validate } from "./middleware/validateMiddleware.js";
import { loginSchema, signupSchema } from "./schema.js";

const appRouter = Router();

appRouter.post("/signup", validate(signupSchema), signUp);
appRouter.post("/login", validate(loginSchema), login);

export default appRouter;

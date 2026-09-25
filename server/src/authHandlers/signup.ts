import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { AppError } from "../middleware/errorMiddleware.js";
import { createUser, userExist } from "@packages/query/query.js";

export async function signUp(req: Request, res: Response) {
  const { email, password } = req.body;
  
  const isExist: boolean = await userExist(email);
  if (isExist) {
    throw new AppError("user already exist", 409, "[ signup.ts ]");
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await createUser(email, hashedPassword);
  if (!newUser) {
    return res
      .status(400)
      .json({ success: false, error: "faild to create user" });
  }
  return res.status(200).json({ success: true, message: "signup successful" });
}

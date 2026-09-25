import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { getUser } from "@packages/query/query.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await getUser(email);
  if (!user) {
    return res.status(409).json({ success: false, error: "user not exist" });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return res
      .status(401)
      .json({ success: false, error: "invalid email or password" });
  }

  if (!process.env.JWT_SECRET) {
    return res
      .status(500)
      .json({ success: false, error: "jwt secret not configured" });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({ success: true, payload: { email: email } });
}

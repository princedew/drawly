import type { Request, Response } from "express";

export function logout(req: Request, res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.status(200).json({ success: true, message: "Logged out" });
}
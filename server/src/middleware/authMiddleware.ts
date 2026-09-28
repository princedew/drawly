import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.token;
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (!secret) {
    return res.status(500).json({ success: false, message: "JWT secret not configured" });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== "object" || typeof payload.userId !== "number") {
      return res.status(401).json({ success: false, message: "Invalid authentication token" });
    }

    res.locals.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
  }
}
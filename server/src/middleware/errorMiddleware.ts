import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  fileName: string;
  constructor(message: string, statusCode: number, fileName: string) {
    super(message);
    this.statusCode = statusCode;
    this.fileName = fileName;
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation Failed",
      issue: err.issues,
    });
  }
  if (err instanceof AppError) {
    console.log(
      `ERROR ${err.fileName} CODE ${err.statusCode} MESSAGE :`,
      err.message,
    );
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }
  console.log(`ERROR-MESSAGE :`, err.message);
  return res.status(500).json({ success: false, message: "Server error" });
};

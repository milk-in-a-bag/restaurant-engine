import { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err);
  const message = err instanceof Error ? err.message : "Something went wrong";
  res.status(500).json({ error: message });
}

import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message || err);

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500
      ? "An internal server error occurred. Please try again later."
      : err.message || "An unexpected error occurred.";

  res.status(statusCode).json({
    error: message,
    statusCode
  });
}

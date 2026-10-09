import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "careerfit-super-secret-key-2026";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      fullName: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

export function generateToken(payload: { id: string; email: string; fullName: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

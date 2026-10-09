import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database";
import { generateToken, AuthRequest } from "../middleware/auth";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({ error: "Email, password, and full name are required." });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters." });
        return;
      }

      const existing = await db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
      if (existing.rows.length > 0) {
        res.status(400).json({ error: "An account with this email already exists." });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = uuidv4();
      const profileId = uuidv4();
      const settingsId = uuidv4();

      await db.query(
        "INSERT INTO users (id, email, password_hash, full_name, email_verified) VALUES ($1, $2, $3, $4, $5)",
        [userId, email.toLowerCase().trim(), passwordHash, fullName.trim(), true]
      );

      await db.query(
        "INSERT INTO profiles (id, user_id, headline) VALUES ($1, $2, $3)",
        [profileId, userId, "Software Professional"]
      );

      await db.query(
        "INSERT INTO user_settings (id, user_id) VALUES ($1, $2)",
        [settingsId, userId]
      );

      const token = generateToken({ id: userId, email: email.toLowerCase().trim(), fullName });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        message: "Registration successful.",
        token,
        user: { id: userId, email: email.toLowerCase().trim(), fullName }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to register user." });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const result = await db.query(
        "SELECT id, email, password_hash, full_name FROM users WHERE email = $1",
        [email.toLowerCase().trim()]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const token = generateToken({ id: user.id, email: user.email, fullName: user.full_name });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        message: "Login successful.",
        token,
        user: { id: user.id, email: user.email, fullName: user.full_name }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to log in." });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully." });
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const result = await db.query(
        `SELECT u.id, u.email, u.full_name, p.headline, p.phone, p.location, p.linkedin_url, p.github_url, s.default_template, s.scoring_weights
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         LEFT JOIN user_settings s ON u.id = s.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "User profile not found." });
        return;
      }

      res.json({ user: result.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch user profile." });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    // Simulate secure token generation
    const resetToken = uuidv4();
    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = CURRENT_TIMESTAMP + INTERVAL '1 hour' WHERE email = $2",
      [resetToken, email?.toLowerCase().trim()]
    );
    res.json({ message: "If that email exists in our system, a password reset link has been dispatched.", resetToken });
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "Valid reset token and minimum 6-character password required." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await db.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2 RETURNING id",
      [passwordHash, resetToken]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ error: "Reset token is invalid or has expired." });
      return;
    }

    res.json({ message: "Password updated successfully. You may now log in." });
  }
}

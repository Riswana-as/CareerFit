"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const auth_1 = require("../middleware/auth");
class AuthController {
    static async register(req, res) {
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
            const existing = await database_1.db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
            if (existing.rows.length > 0) {
                res.status(400).json({ error: "An account with this email already exists." });
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            const userId = (0, uuid_1.v4)();
            const profileId = (0, uuid_1.v4)();
            const settingsId = (0, uuid_1.v4)();
            await database_1.db.query("INSERT INTO users (id, email, password_hash, full_name, email_verified) VALUES ($1, $2, $3, $4, $5)", [userId, email.toLowerCase().trim(), passwordHash, fullName.trim(), true]);
            await database_1.db.query("INSERT INTO profiles (id, user_id, headline) VALUES ($1, $2, $3)", [profileId, userId, "Software Professional"]);
            await database_1.db.query("INSERT INTO user_settings (id, user_id) VALUES ($1, $2)", [settingsId, userId]);
            const token = (0, auth_1.generateToken)({ id: userId, email: email.toLowerCase().trim(), fullName });
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
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to register user." });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: "Email and password are required." });
                return;
            }
            const result = await database_1.db.query("SELECT id, email, password_hash, full_name FROM users WHERE email = $1", [email.toLowerCase().trim()]);
            if (result.rows.length === 0) {
                res.status(401).json({ error: "Invalid email or password." });
                return;
            }
            const user = result.rows[0];
            const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isMatch) {
                res.status(401).json({ error: "Invalid email or password." });
                return;
            }
            const token = (0, auth_1.generateToken)({ id: user.id, email: user.email, fullName: user.full_name });
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
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to log in." });
        }
    }
    static async logout(req, res) {
        res.clearCookie("token");
        res.json({ message: "Logged out successfully." });
    }
    static async me(req, res) {
        try {
            const userId = req.user?.id;
            const result = await database_1.db.query(`SELECT u.id, u.email, u.full_name, p.headline, p.phone, p.location, p.linkedin_url, p.github_url, s.default_template, s.scoring_weights
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         LEFT JOIN user_settings s ON u.id = s.user_id
         WHERE u.id = $1`, [userId]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: "User profile not found." });
                return;
            }
            res.json({ user: result.rows[0] });
        }
        catch (err) {
            res.status(500).json({ error: err.message || "Failed to fetch user profile." });
        }
    }
    static async forgotPassword(req, res) {
        const { email } = req.body;
        // Simulate secure token generation
        const resetToken = (0, uuid_1.v4)();
        await database_1.db.query("UPDATE users SET reset_token = $1, reset_token_expires = CURRENT_TIMESTAMP + INTERVAL '1 hour' WHERE email = $2", [resetToken, email?.toLowerCase().trim()]);
        res.json({ message: "If that email exists in our system, a password reset link has been dispatched.", resetToken });
    }
    static async resetPassword(req, res) {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword || newPassword.length < 6) {
            res.status(400).json({ error: "Valid reset token and minimum 6-character password required." });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        const result = await database_1.db.query("UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2 RETURNING id", [passwordHash, resetToken]);
        if (result.rows.length === 0) {
            res.status(400).json({ error: "Reset token is invalid or has expired." });
            return;
        }
        res.json({ message: "Password updated successfully. You may now log in." });
    }
}
exports.AuthController = AuthController;

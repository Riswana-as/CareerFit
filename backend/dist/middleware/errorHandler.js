"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.path}:`, err.message || err);
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500
        ? "An internal server error occurred. Please try again later."
        : err.message || "An unexpected error occurred.";
    res.status(statusCode).json({
        error: message,
        statusCode
    });
}

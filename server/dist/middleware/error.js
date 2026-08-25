"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
        return;
    }
    console.error("[ERROR]", err.stack || err.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: err.message || "Internal server error" } });
}
//# sourceMappingURL=error.js.map
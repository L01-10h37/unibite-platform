import { successResponse, paginatedResponse, errorResponse } from "../utils/responseHandler.js";
import { logger } from "../utils/logger.js";
import * as authService from "../services/authService.js";

/**
 * Register new user
 */
export const register = async (req, res, next) => {
    try {
        const userData = req.body;
        const user = await authService.register(userData);
        successResponse(res, user, "User registered successfully", 201);
    } catch (error) {
        logger.error("Error registering user", error);
        errorResponse(res, error, "Failed to register user", 500);
    }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        logger.info("Login successful:", { refreshToken: result.refreshToken });
        successResponse(res, result, "User logged in successfully", 200);
    } catch (error) {
        logger.error("Error logging in user", error);
        errorResponse(res, error, "Failed to log in user", 500);
    }
};

/**
 * Logout user
 */
export const logout = async (req, res, next) => {
    try {
        successResponse(res, null, "User logged out successfully", 200);
    } catch (error) {
        logger.error("Error logging out user", error);
        errorResponse(res, error, "Failed to log out user", 500);
    }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res, next) => {
    try {
        const currentRefreshToken = req.cookies?.refreshToken;
        
        if (!currentRefreshToken) {
            return errorResponse(res, null, "Refresh token is missing or expired", 401);
        }

        logger.info("Refreshing access token");
        
        const result = await authService.refreshToken(currentRefreshToken);

        if (result.refreshToken) {
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // Tự động bật secure khi lên production
                sameSite: "lax",
            });
            delete result.refreshToken; // Xóa khỏi payload trả về client giống như lúc login
        }

        successResponse(res, result, "Access token refreshed successfully", 200);
    } catch (error) {
        logger.error("Error refreshing access token", error);
        
        const statusCode = error.statusCode || 401; 
        errorResponse(res, error, error.message || "Failed to refresh access token", statusCode);
    }
};
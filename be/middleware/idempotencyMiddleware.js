import { getRedisClient } from "../config/redis.js";
import logger from "../utils/logger.js";
import { errorResponse, successResponse } from '../utils/responseHandler.js';

export const idempotencyMiddleware = async (req, res, next) => {
    const key = req.headers["idempotency-key"];

    if (!key) return next();

    if (!req.user || !req.user.id) {
        return next();
    }

    const redisKey = `idem:${req.user.id}:${key}`;

    try {
        const client = getRedisClient();

        const existing = await client.get(redisKey);

        if (existing) {
            const data = typeof existing === 'string' ? JSON.parse(existing) : existing;

            if (data.status === "SUCCESS") {
                return successResponse(res, data.response, "Payment was successful", 200)
            }

            if (data.status === "PROCESSING") {
                return errorResponse(res, null, "Request is being processed", 409)
            }
        }

        const lock = await client.set(redisKey, JSON.stringify({ status: "PROCESSING" }), {
            NX: true,
            EX: 60
        });

        if (!lock) {
            return errorResponse(res, null, "Request is being processed", 409);
        }

        req.idemKey = redisKey;

        next();
    } catch (error) {
        logger.error('Idempotency middleware error:', error);
        next();   
    }
};
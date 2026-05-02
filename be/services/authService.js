import { logger } from '../utils/logger.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import environment from '../config/environment.js';

/**
 * Register new user
 */
export const register = async (userData) => {
	try {
		logger.info("Registering new user");
		// Kiểm tra username đã tồn tại
		const existingUser = await User.findOne({ phone: userData.phone, username: userData.username });
		if (existingUser) {
			const error = new Error('Phone number or Username already exists');
			error.statusCode = 409;
			throw error;
		}
		// Hash password    
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(userData.password, salt);
		const user = new User({
			username: userData.username,
			phone: userData.phone,
			password: hashedPassword,
		});
		await user.save();
		return user.getFormattedData?.() || user;
	} catch (error) {
		logger.error('Service: Error registering user', error);
		throw error;
	}
};

/**
 * Login user
 */
export const login = async (username, password) => {
	try {

		logger.info(`Service: Logging in user with username: ${username}`);
		const user = await User.findOne({ username });
		if (!user) {
			const error = new Error('Invalid username or password');
			error.statusCode = 401;
			throw error;
		}
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			const error = new Error('Invalid username or password');
			error.statusCode = 401;
			throw error;
		}
		const payload = { id: user._id, username: user.username, role: user.role };
		const accessToken = jwt.sign(payload, environment.jwt_access_secret, { expiresIn: '15m' });
		const refreshToken = jwt.sign(payload, environment.jwt_refresh_secret, { expiresIn: '7d' });
		return { accessToken, refreshToken };
	} catch (error) {
		logger.error('Service: Error logging in user', error);
		throw error;
	}
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken) => {
	try {
		logger.info('Service: Refreshing access token');
		const decoded = jwt.verify(refreshToken, environment.jwt_refresh_secret);
		const payload = { id: decoded.id, username: decoded.username, role: decoded.role };
		const accessToken = jwt.sign(payload, environment.jwt_access_secret, { expiresIn: '15m' });
		return { accessToken };
	} catch (error) {
		logger.error('Service: Error refreshing access token', error);
		const err = new Error('Invalid refresh token');
		err.statusCode = 401;
		throw err;
	}
};
import express from 'express';
import * as usersController from '../controllers/usersController.js';
import * as authMiddleware from '../middleware/authMiddleware.js';
import { uploadSingleFile, handleUploadError } from '../middleware/uploadMiddleware.js';
const router = express.Router();

/**
 * GET current user profile
 */
router.get('/me', authMiddleware.authenticate, usersController.getMe);

/**
 * PATCH update current user profile (name, phone only)
 */
router.patch('/me', authMiddleware.authenticate, usersController.updateProfile);

/**
 * PATCH update user avatar
 */
router.patch('/me/avatar', authMiddleware.authenticate, uploadSingleFile, handleUploadError, usersController.updateAvatar);

/**
 * PATCH change user password
 */
router.patch('/me/password', authMiddleware.authenticate, usersController.changePassword);

/**
 * GET all users
 */
router.get('/', authMiddleware.authenticate, usersController.getAllUsers);

/**
 * GET user by ID
 */
router.get('/:id', authMiddleware.authenticate, usersController.getUserById);

/**
 * POST create new user
 */
router.post('/', authMiddleware.authenticate, usersController.createUser);

/**
 * PUT update user
 */
router.put('/:id', authMiddleware.authenticate, usersController.updateUser);

/**
 * DELETE user
 */ 
router.delete('/:id', authMiddleware.authenticate, authMiddleware.authorize(['admin']), usersController.deleteUser);



export default router;

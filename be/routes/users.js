import express from 'express';
import * as usersController from '../controllers/usersController.js';

const router = express.Router();

/**
 * GET all users
 */
router.get('/', usersController.getAllUsers);

/**
 * GET user by ID
 */
router.get('/:id', usersController.getUserById);

/**
 * POST create new user
 */
router.post('/', usersController.createUser);

/**
 * PUT update user
 */
router.put('/:id', usersController.updateUser);

/**
 * DELETE user
 */
router.delete('/:id', usersController.deleteUser);

export default router;

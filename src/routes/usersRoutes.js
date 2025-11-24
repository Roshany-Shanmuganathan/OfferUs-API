import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/usersController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user management routes require admin role
// GET /api/users - Get all users (admin only)
router.get('/', verifyToken, requireRole('admin'), getUsers);

// GET /api/users/:id - Get single user (admin only)
router.get('/:id', verifyToken, requireRole('admin'), getUser);

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', verifyToken, requireRole('admin'), updateUser);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', verifyToken, requireRole('admin'), deleteUser);

export default router;


import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController.js';
import { verifyToken, verifyRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication (members, partners, admins)
router.use(verifyToken);
router.use(verifyRole(['member', 'partner', 'admin']));

// Notification routes
router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);

export default router;


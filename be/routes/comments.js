import express from 'express';
import * as commentController from '../controllers/commentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/comment/:id
 * Lấy danh sách comments của một entity (phân trang)
 * Auth: required
 */
router.get('/:id', authenticate, commentController.getComments);

/**
 * POST /api/comment/:id
 * Thêm comment mới
 * Auth: required | Body: { content: string }
 */
router.post('/:id', authenticate, commentController.addComment);

/**
 * DELETE /api/comment/:id/remove
 * Xóa comment (soft delete, chỉ chủ sở hữu)
 * Auth: required | Body: { cmtId: string }
 */
router.delete('/:id/remove', authenticate, commentController.removeComment);

/**
 * PUT /api/comment/:id/like
 * Like / Unlike một comment
 * Auth: required | Body: { cmtId: string, type: 'inc' | 'dec' }
 */
router.put('/:id/like', authenticate, commentController.likeComment);

export default router;

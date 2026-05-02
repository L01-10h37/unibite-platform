import { successResponse, paginatedResponse, errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import * as commentService from '../services/commentService.js';

/**
 * GET /api/comment/:id
 * Lấy danh sách comments của một entity (có phân trang)
 *
 * @param {string} req.params.id    - postId (ID của entity)
 * @param {number} req.query.page   - Trang (mặc định 1)
 * @param {number} req.query.limit  - Số lượng mỗi trang (mặc định 10)
 */
export const getComments = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    logger.info(`Fetching comments for postId: ${postId} - Page: ${page}, Limit: ${limit}`);

    const result = await commentService.getCommentsByPostId(postId, page, limit);

    paginatedResponse(
      res,
      result.comments,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      'Comments retrieved successfully',
      200
    );
  } catch (error) {
    logger.error('Error fetching comments', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to fetch comments', statusCode);
  }
};

/**
 * POST /api/comment/:id
 * Thêm comment mới vào một entity
 *
 * @param {string} req.params.id   - postId (ID của entity)
 * @param {string} req.body.content - Nội dung comment
 * @param {object} req.user         - User từ JWT (được gắn bởi authMiddleware)
 */
export const addComment = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!content || content.trim().length === 0) {
      return errorResponse(res, null, 'Content is required', 400);
    }

    logger.info(`Adding comment to postId: ${postId} by userId: ${userId}`);

    const comment = await commentService.addComment(postId, userId, content);

    successResponse(res, comment, 'Comment added successfully', 201);
  } catch (error) {
    logger.error('Error adding comment', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to add comment', statusCode);
  }
};

/**
 * DELETE /api/comment/:id/remove
 * Xóa một comment (soft delete, chỉ chủ sở hữu mới được xóa)
 *
 * @param {string} req.params.id  - postId (không bắt buộc nhưng giữ consistency với route)
 * @param {string} req.body.cmtId - ID của comment cần xóa
 * @param {object} req.user       - User từ JWT (được gắn bởi authMiddleware)
 */
export const removeComment = async (req, res, next) => {
  try {
    const { cmtId } = req.body;
    const userId = req.user?.id;

    if (!cmtId) {
      return errorResponse(res, null, 'cmtId is required', 400);
    }

    logger.info(`Removing comment ${cmtId} by userId: ${userId}`);

    await commentService.removeComment(cmtId, userId);

    successResponse(res, null, 'Comment deleted successfully', 200);
  } catch (error) {
    logger.error('Error removing comment', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to delete comment', statusCode);
  }
};

/**
 * PUT /api/comment/:id/like
 * Like hoặc Unlike một comment
 *
 * @param {string}       req.params.id   - postId
 * @param {string}       req.body.cmtId  - ID của comment
 * @param {'inc'|'dec'}  req.body.type   - 'inc' để like, 'dec' để unlike
 * @param {object}       req.user        - User từ JWT (được gắn bởi authMiddleware)
 */
export const likeComment = async (req, res, next) => {
  try {
    const { cmtId, type } = req.body;
    const userId = req.user?.id;

    if (!cmtId) {
      return errorResponse(res, null, 'cmtId is required', 400);
    }

    if (!type || !['inc', 'dec'].includes(type)) {
      return errorResponse(res, null, "type must be 'inc' or 'dec'", 400);
    }

    logger.info(`${type === 'inc' ? 'Liking' : 'Unliking'} comment ${cmtId} by userId: ${userId}`);

    const comment = await commentService.likeComment(cmtId, userId, type);

    successResponse(res, comment, type === 'inc' ? 'Comment liked' : 'Comment unliked', 200);
  } catch (error) {
    logger.error('Error liking/unliking comment', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to update like', statusCode);
  }
};

import { logger } from '../utils/logger.js';
import Comment from '../models/Comment.js';
import mongoose from 'mongoose';

/**
 * Validate MongoDB ObjectId
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Lấy danh sách comments theo postId (có phân trang)
 *
 * @param {string} postId - ID của entity (post/food/restaurant)
 * @param {number} page   - Trang hiện tại (mặc định 1)
 * @param {number} limit  - Số lượng mỗi trang (mặc định 10)
 * @returns {{ comments: object[], pagination: object }}
 */
export const getCommentsByPostId = async (postId, page = 1, limit = 10) => {
  try {
    logger.info(`Service: Getting comments for postId: ${postId}`);

    if (!isValidObjectId(postId)) {
      const error = new Error('Invalid postId format');
      error.statusCode = 400;
      throw error;
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ postId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username name avatar'), // join thông tin user
      Comment.countDocuments({ postId, isDeleted: false }),
    ]);

    return {
      comments: comments.map((c) => c.getFormattedData?.() || c),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Service: Error getting comments', error);
    throw error;
  }
};

/**
 * Thêm comment mới
 *
 * @param {string} postId  - ID của entity được comment
 * @param {string} userId  - ID người dùng (từ JWT token)
 * @param {string} content - Nội dung comment
 * @returns {object} comment đã tạo
 */
export const addComment = async (postId, userId, content) => {
  try {
    logger.info(`Service: Adding comment to postId: ${postId} by userId: ${userId}`);

    if (!isValidObjectId(postId)) {
      const error = new Error('Invalid postId format');
      error.statusCode = 400;
      throw error;
    }

    if (!content || content.trim().length === 0) {
      const error = new Error('Content is required');
      error.statusCode = 400;
      throw error;
    }

    const comment = await Comment.create({
      postId,
      userId,
      content: content.trim(),
    });

    // Populate userId để trả về đầy đủ thông tin
    await comment.populate('userId', 'username name avatar');

    return comment.getFormattedData?.() || comment;
  } catch (error) {
    logger.error('Service: Error adding comment', error);
    throw error;
  }
};

/**
 * Xóa comment (soft delete)
 * Chỉ chủ sở hữu comment mới được xóa.
 *
 * @param {string} cmtId  - ID của comment cần xóa
 * @param {string} userId - ID người dùng (từ JWT token)
 * @returns {boolean} true nếu xóa thành công
 */
export const removeComment = async (cmtId, userId) => {
  try {
    logger.info(`Service: Removing comment ${cmtId} by userId: ${userId}`);

    if (!isValidObjectId(cmtId)) {
      const error = new Error('Invalid cmtId format');
      error.statusCode = 400;
      throw error;
    }

    const comment = await Comment.findOne({ _id: cmtId, isDeleted: false });

    if (!comment) {
      const error = new Error('Comment not found');
      error.statusCode = 404;
      throw error;
    }

    // Chỉ chủ sở hữu mới có quyền xóa
    if (comment.userId.toString() !== userId.toString()) {
      const error = new Error('You are not authorized to delete this comment');
      error.statusCode = 403;
      throw error;
    }

    // Soft delete: đánh dấu isDeleted thay vì xóa vật lý
    comment.isDeleted = true;
    await comment.save();

    return true;
  } catch (error) {
    logger.error('Service: Error removing comment', error);
    throw error;
  }
};

/**
 * Like hoặc Unlike một comment
 *
 * Logic:
 * - type = 'inc': thêm like (nếu chưa like)
 * - type = 'dec': bỏ like (nếu đã like)
 * Tránh duplicate bằng cách kiểm tra userId trong mảng likes.
 *
 * @param {string} cmtId  - ID của comment
 * @param {string} userId - ID người dùng (từ JWT token)
 * @param {'inc'|'dec'} type - Tăng hoặc giảm lượt like
 * @returns {object} comment sau khi cập nhật
 */
export const likeComment = async (cmtId, userId, type) => {
  try {
    logger.info(`Service: ${type === 'inc' ? 'Liking' : 'Unliking'} comment ${cmtId} by userId: ${userId}`);

    if (!isValidObjectId(cmtId)) {
      const error = new Error('Invalid cmtId format');
      error.statusCode = 400;
      throw error;
    }

    if (!['inc', 'dec'].includes(type)) {
      const error = new Error("type must be 'inc' or 'dec'");
      error.statusCode = 400;
      throw error;
    }

    const comment = await Comment.findOne({ _id: cmtId, isDeleted: false });

    if (!comment) {
      const error = new Error('Comment not found');
      error.statusCode = 404;
      throw error;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = comment.likes.some((id) => id.equals(userObjectId));

    if (type === 'inc') {
      if (alreadyLiked) {
        const error = new Error('You already liked this comment');
        error.statusCode = 409;
        throw error;
      }
      comment.likes.push(userObjectId);
      comment.likeCount += 1;
    } else {
      if (!alreadyLiked) {
        const error = new Error('You have not liked this comment');
        error.statusCode = 409;
        throw error;
      }
      comment.likes = comment.likes.filter((id) => !id.equals(userObjectId));
      comment.likeCount = Math.max(0, comment.likeCount - 1);
    }

    await comment.save();
    await comment.populate('userId', 'username name avatar');

    return comment.getFormattedData?.() || comment;
  } catch (error) {
    logger.error('Service: Error liking/unliking comment', error);
    throw error;
  }
};

import mongoose from 'mongoose';

/**
 * Comment Schema for MongoDB
 *
 * Mỗi comment thuộc về một "entity" (post, food, restaurant, v.v.)
 * được xác định qua `postId` (chính là :id trên route /comment/:id).
 *
 * Likes được lưu dưới dạng mảng userId để tránh like trùng,
 * và `likeCount` được cache để tránh phải count() liên tục.
 */
const commentSchema = new mongoose.Schema(
  {
    /** ID của entity được comment (post, food item, v.v.) */
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'postId is required'],
      index: true,
    },

    /** Người viết comment */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },

    /** Nội dung comment */
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [1, 'Content must not be empty'],
      maxlength: [1000, 'Content must not exceed 1000 characters'],
    },

    /**
     * Danh sách userId đã like comment này.
     * Dùng Set logic: nếu userId đã có → unlike (dec), chưa có → like (inc).
     */
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    /** Cache số lượt like, đồng bộ với likes.length */
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Soft delete: không xóa vật lý để giữ integrity */
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // tự động thêm createdAt, updatedAt
  }
);

// Index kết hợp để query nhanh comments theo postId và thời gian
commentSchema.index({ postId: 1, createdAt: -1 });

/**
 * Format dữ liệu trả về client (ẩn các field nội bộ)
 */
commentSchema.methods.getFormattedData = function () {
  return {
    id: this._id,
    postId: this.postId,
    userId: this.userId,
    content: this.content,
    likeCount: this.likeCount,
    likes: this.likes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

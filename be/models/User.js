import mongoose from 'mongoose';

/**
 * User Schema for MongoDB
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must not exceed 50 characters'],
      default: function () {
        return this.username; // Mặc định đặt theo username
      },
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username only contains letters, numbers, underscore'],
      minlength: [6, 'Username must be at least 6 characters'],
      trim: true,
      unique: true,
    },
    // email: {
    //   type: String,
    //   required: [true, 'Email is required'],
    //   unique: true,
    //   lowercase: true,
    //   match: [
    //     /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    //     'Please enter a valid email address',
    //   ],
    // },
    phone: {
      type: String,
      match: [
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        'Please enter a valid phone number',
      ],
      unique: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'seller', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt, updatedAt
  }
);

// Index email
userSchema.index({ email: 1 });

/**
 * Timestamps helper
 */
userSchema.methods.getFormattedData = function () {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    // email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Tạo model
const User = mongoose.model('User', userSchema);

export default User;

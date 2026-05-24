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
    addresses: {
      type: [
        {
          _id: {
            type: String,
            default: () => new mongoose.Types.ObjectId().toString(),
          },
          title: {
            type: String,
            trim: true,
            maxlength: [80, 'Address title must not exceed 80 characters'],
          },
          type: {
            type: String,
            enum: ['home', 'school', 'office', 'other'],
            default: 'other',
          },
          address: {
            type: String,
            trim: true,
            maxlength: [300, 'Address must not exceed 300 characters'],
          },
          latitude: {
            type: Number,
          },
          longitude: {
            type: Number,
          },
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },
    defaultDeliveryAddressId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt, updatedAt
  }
);



/**
 * Timestamps helper
 */
userSchema.methods.getFormattedData = function () {
  const defaultAddress = this.addresses?.find(
    (addr) => this.defaultDeliveryAddressId && String(addr._id) === String(this.defaultDeliveryAddressId)
  );

  return {
    id: this._id,
    name: this.name,
    username: this.username,
    // email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    role: this.role,
    isActive: this.isActive,
    addresses: (this.addresses || []).map((addr) => ({
      id: addr._id,
      title: addr.title,
      type: addr.type,
      address: addr.address,
      latitude: addr.latitude,
      longitude: addr.longitude,
      isDefault:
        !!this.defaultDeliveryAddressId && String(addr._id) === String(this.defaultDeliveryAddressId),
      createdAt: addr.createdAt,
      updatedAt: addr.updatedAt,
    })),
    defaultDeliveryAddressId: this.defaultDeliveryAddressId,
    defaultDeliveryAddress: defaultAddress
      ? {
          id: defaultAddress._id,
          title: defaultAddress.title,
          type: defaultAddress.type,
          address: defaultAddress.address,
          latitude: defaultAddress.latitude,
          longitude: defaultAddress.longitude,
        }
      : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Tạo model
const User = mongoose.model('User', userSchema);

export default User;

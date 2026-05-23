import mongoose from 'mongoose';
/**
 * Shop Schema
 */
const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      minlength: [2, 'Shop name must be at least 2 characters'],
      maxlength: [100, 'Shop name must not exceed 100 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // liên kết tới User
      required: [true, 'Owner (userId) is required'],
      unique: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    openingHours: {
      type: String,
      trim: true,
      maxlength: [100, 'Opening hours must not exceed 100 characters'],
      default: '',
    },
    about: {
      type: String,
      trim: true,
      maxlength: [500, 'About must not exceed 500 characters'],
      default: '',
    },
    average_rating: {
      type: Number,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating must not exceed 5'],
      default: 0,
    },
    rating_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

shopSchema.methods.getFormattedData = function () {
  return {
    id: this._id,
    name: this.name,
    userId: this.userId,
    avatar: this.avatar,
    address: this.address,
    openingHours: this.openingHours,
    about: this.about,
    average_rating: this.average_rating,
    rating_count: this.rating_count,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Shop = mongoose.model('Shop', shopSchema);

export default Shop;

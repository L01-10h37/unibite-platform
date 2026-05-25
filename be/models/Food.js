import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    listUrlImg: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    specialPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    startTime: {
      type: String,
      default: null,
      trim: true,
    },
    endTime: {
      type: String,
      default: null,
      trim: true,
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
    sold_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

foodSchema.methods.getFormattedData = function () {
  const categoryData = this.category;
  const shopData = this.shop;

  return {
    id: this._id,
    name: this.name,
    description: this.description,
    categoryId: categoryData?._id || categoryData || null,
    categoryName: categoryData?.name || null,
    shopId: shopData?._id || shopData || null,
    shopName: shopData?.name || null,
    listUrlImg: this.listUrlImg,
    isAvailble: this.isAvailble,
    isDraft: this.isDraft,
    price: this.price,
    specialPrice: this.specialPrice,
    startTime: this.startTime,
    endTime: this.endTime,
    average_rating: this.average_rating,
    rating_count: this.rating_count,
    sold_count: this.sold_count,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Food = mongoose.model('Food', foodSchema);

export default Food;
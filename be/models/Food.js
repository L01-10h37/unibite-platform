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
    isAvailble: {
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
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Food = mongoose.model('Food', foodSchema);

export default Food;
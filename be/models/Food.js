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
    specialtime: {
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
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    category: this.category,
    shop: this.shop,
    listUrlImg: this.listUrlImg,
    isAvailble: this.isAvailble,
    isDraft: this.isDraft,
    price: this.price,
    specialPrice: this.specialPrice,
    specialtime: this.specialtime,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Food = mongoose.model('Food', foodSchema);

export default Food;
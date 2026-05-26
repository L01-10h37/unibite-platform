import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", 
      default: null, // null = category gốc
    },
  },
  {
    timestamps: true,
  }
);

// Return formatted data for API responses
categorySchema.methods.getFormattedData = function () {
  return {
    id: this._id,
    name: this.name,
    parentId: this.parentId,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model("Category", categorySchema);

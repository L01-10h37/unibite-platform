import mongoose from 'mongoose';

/**
 * Order Schema for MongoDB
*/
const orderItemSchema = new mongoose.Schema(
	{
		foodId: { // Sẽ sửa sau khi có bảng Food
			type: String,
			default: "Bún bò",
		},

		// foodId: {
		// 	type: mongoose.Schema.Types.ObjectId,
		// 	ref: "Food",
		// 	required: true,
		// },

		name: String, 

		price: Number,

		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
	},
	{_id: false}
);


const orderSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		items: {
			type: [orderItemSchema],
			validate: [(val) => val.length > 0, "Order must have at least 1 item"],
		},

		totalPrice: {
			type: Number,
			required: true,
		},

		status: {
			type: String,
			enum: [
				"PENDING",
				"CONFIRMED",
				"PREPARING",
				"DELIVERING",
				"COMPLETED",
				"CANCELLED",
			],
			default: "PENDING",
		},

		isPaid: {
			type: Boolean,
			default: false,
		},

		deliveryAddress: {
			type: String,
			required: true,
		},

		phone: {
			type: String,
			required: true,
		},

		note: String,

		statusHistory: [
			{
				status: String,
				updatedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{
		timestamps: true, 
	}
);

orderSchema.index({ userId: 1, createdAt: -1});
orderSchema.index({ status: 1});

orderSchema.methods.getFormattedData = function (type = "basic") {
	if (type === "basic") {
		return {
			id: this._id,
			totalPrice: this.totalPrice,
			status: this.status,
		};
	};

	if (type === "detail") {
		return {
			id: this._id,
			items: this.items,
			totalPrice: this.totalPrice,
			status: this.status,
			phone: this.phone,
			deliveryAddress: this.deliveryAddress,
			statusHistory: this.statusHistory,
		};
	};
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
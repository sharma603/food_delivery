import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantUser', required: true },
  multiRestaurantData: { type: mongoose.Schema.Types.Mixed }, // Store multi-restaurant order data
  items: [{
    menuItem: {
      name: { type: String },
      price: { type: Number },
      image: { type: String }, // Keep for backward compatibility
      images: [{ type: String }], // Store all images
      description: { type: String }, // Store description
      category: { type: String } // Store category name
    },
    quantity: { type: Number, required: true },
    customizations: [{
      name: { type: String },
      selectedOptions: [{ type: String }],
      additionalPrice: { type: Number, default: 0 }
    }],
    subtotal: { type: Number, required: true }
  }],
  deliveryAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  pricing: {
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  status: { type: String, enum: ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'], default: 'placed' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String },
  paymentId: { type: String },
  estimatedDeliveryTime: { type: Date },
  pickedUpAt: { type: Date },
  actualDeliveryTime: { type: Date },
  deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trackingUpdates: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    message: { type: String }
  }],
  deliveryOtp: {
    code: { type: String },
    expiresAt: { type: Date },
    resendCount: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
  }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

orderSchema.index({ customer: 1 });
orderSchema.index({ restaurant: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
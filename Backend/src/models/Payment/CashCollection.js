import mongoose from 'mongoose';

const cashCollectionSchema = new mongoose.Schema({
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPersonnel',
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  collectedAt: {
    type: Date,
    default: Date.now
  },
  submissionStatus: {
    type: String,
    enum: ['pending', 'submitted', 'reconciled', 'discrepancy'],
    default: 'pending',
    index: true
  },
  submittedAt: {
    type: Date
  },
  submittedAmount: {
    type: Number,
    min: [0, 'Submitted amount cannot be negative']
  },
  reconciledAt: {
    type: Date
  },
  reconciledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  notes: {
    type: String,
    trim: true
  },
  depositProof: {
    type: String, // URL or path to deposit proof image/receipt
    trim: true
  },
  discrepancy: {
    expected: Number,
    actual: Number,
    reason: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
cashCollectionSchema.index({ deliveryPerson: 1, submissionStatus: 1 });
cashCollectionSchema.index({ collectedAt: -1 });
cashCollectionSchema.index({ order: 1 });

// Virtual for calculated discrepancy amount
cashCollectionSchema.virtual('discrepancyAmount').get(function() {
  if (this.discrepancy && this.discrepancy.expected && this.discrepancy.actual) {
    return this.discrepancy.expected - this.discrepancy.actual;
  }
  return 0;
});

const CashCollection = mongoose.model('CashCollection', cashCollectionSchema);

export default CashCollection;


// Chat Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderType',
    required: true
  },
  senderType: {
    type: String,
    required: true,
    enum: ['Customer', 'Restaurant', 'DeliveryPartner', 'Admin']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }],
  isInternal: {
    type: Boolean,
    default: false // Internal messages are only visible to support staff
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'readBy.userType'
    },
    userType: {
      type: String,
      enum: ['Customer', 'Restaurant', 'DeliveryPartner', 'Admin']
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ ticket: 1, createdAt: 1 });
chatSchema.index({ sender: 1, senderType: 1 });

export default mongoose.model('Chat', chatSchema);

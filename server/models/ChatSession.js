import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'archived'],
    default: 'draft'
  },
  services: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  pricing: {
    subtotal: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'SAR' }
  },
  lastMessage: {
    type: String,
    maxlength: [500, 'Last message cannot exceed 500 characters']
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ status: 1 });

// Virtual for estimated cost display
chatSessionSchema.virtual('estimatedCost').get(function() {
  return this.pricing.total || 0;
});

// Update status based on completion
chatSessionSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Generate title from services if not provided
chatSessionSchema.pre('save', function(next) {
  if (!this.title && this.services && Array.isArray(this.services) && this.services.length > 0) {
    const serviceNames = this.services.map(s => s.name || s.service || 'Unknown Service').join(', ');
    this.title = `${serviceNames} Configuration`;
  }
  next();
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;

import mongoose from 'mongoose';

const newChatSessionSchema = new mongoose.Schema({
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
  servicesData: [{
    name: String,
    type: String,
    config: mongoose.Schema.Types.Mixed,
    monthlyCost: Number,
    selected: { type: Boolean, default: false }
  }],
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
  }
}, {
  timestamps: true
});

const NewChatSession = mongoose.model('NewChatSession', newChatSessionSchema);

export default NewChatSession;

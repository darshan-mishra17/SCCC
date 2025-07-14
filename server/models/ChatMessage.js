import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['user', 'ai', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [10000, 'Message content cannot exceed 10000 characters']
  },
  metadata: {
    // For AI messages - store prompt type, context, etc.
    promptType: String,
    context: mongoose.Schema.Types.Mixed,
    
    // For service recommendations
    servicesRecommended: [{
      name: String,
      config: mongoose.Schema.Types.Mixed,
      cost: Number
    }],
    
    // For user messages - store any additional context
    userContext: mongoose.Schema.Types.Mixed,
    
    // Processing time for AI responses
    processingTimeMs: Number,
    
    // Error information if message failed
    error: String
  },
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
  },
  sequenceNumber: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Compound index for efficient message retrieval
chatMessageSchema.index({ sessionId: 1, sequenceNumber: 1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });

// Auto-increment sequence number per session
chatMessageSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastMessage = await this.constructor.findOne(
      { sessionId: this.sessionId },
      {},
      { sort: { sequenceNumber: -1 } }
    );
    this.sequenceNumber = lastMessage ? lastMessage.sequenceNumber + 1 : 1;
  }
  next();
});

// Soft delete method
chatMessageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to mark as edited
chatMessageSchema.methods.markAsEdited = function() {
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;

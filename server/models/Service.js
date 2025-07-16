import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String },
  category: { type: String, required: true },
  description: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active' },
  requiredFields: [String], // Simple array of field names for admin panel
  detailedFields: [
    {
      key: { type: String, required: true },
      label: { type: String },
      type: { type: String, enum: ['text', 'number', 'select', 'checkbox'], default: 'text' },
      options: [String],
      min: Number,
      max: Number,
      required: { type: Boolean, default: false }
    }
  ],
  pricingModel: { type: String, default: 'hourly' },
  exampleConfig: { type: Object },
  defaultEstimatedMonthlyCost: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
});

// Update timestamps on save
serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;

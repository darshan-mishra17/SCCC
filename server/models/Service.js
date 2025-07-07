import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: { type: String },
  description: { type: String },
  requiredFields: [
    {
      key: { type: String, required: true },
      label: { type: String },
      type: { type: String },
      options: [String],
      min: Number,
      max: Number
    }
  ],
  pricingModel: { type: String },
  unitPriceUSD: { type: Number },
  exampleConfig: { type: Object },
  defaultEstimatedMonthlyCost: { type: Number }
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;

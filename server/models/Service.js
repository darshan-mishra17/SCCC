import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  pricingModel: String,
  unitPriceUSD: Number,
  exampleConfig: Object,
  defaultEstimatedMonthlyCost: Number,
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;

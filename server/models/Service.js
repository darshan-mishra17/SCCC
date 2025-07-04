const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  pricingModel: String,
  unitPriceUSD: Number,
  exampleConfig: Object,
  defaultEstimatedMonthlyCost: Number,
});

module.exports = mongoose.model('Service', serviceSchema);

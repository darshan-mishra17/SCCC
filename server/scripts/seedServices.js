// scripts/seedServices.js
// Script to seed dummy cloud services into MongoDB

const mongoose = require('mongoose');
require('dotenv').config();

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

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sccc';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const services = [
    {
      name: 'ECS',
      description: 'Elastic Compute Service for hosting applications',
      category: 'Compute',
      pricingModel: 'PayAsYouGo',
      unitPriceUSD: 0.12,
      exampleConfig: { instanceType: 'ecs.g6.large', storageGB: 100 },
      defaultEstimatedMonthlyCost: 150,
    },
    {
      name: 'OSS',
      description: 'Object Storage Service for storing files and backups',
      category: 'Storage',
      pricingModel: 'PayAsYouGo',
      unitPriceUSD: 0.025,
      exampleConfig: { storageGB: 500 },
      defaultEstimatedMonthlyCost: 30,
    },
    {
      name: 'RDS',
      description: 'Relational Database Service for managed databases',
      category: 'Database',
      pricingModel: 'PayAsYouGo',
      unitPriceUSD: 0.20,
      exampleConfig: { engine: 'MySQL', nodes: 2 },
      defaultEstimatedMonthlyCost: 120,
    },
    {
      name: 'NAT',
      description: 'Network Address Translation Gateway',
      category: 'Networking',
      pricingModel: 'PayAsYouGo',
      unitPriceUSD: 0.05,
      exampleConfig: { bandwidthMbps: 100 },
      defaultEstimatedMonthlyCost: 40,
    },
    {
      name: 'WAF',
      description: 'Web Application Firewall for security',
      category: 'Security',
      pricingModel: 'PayAsYouGo',
      unitPriceUSD: 0.10,
      exampleConfig: { rules: 10 },
      defaultEstimatedMonthlyCost: 25,
    },
    {
      name: 'Backup',
      description: 'Cloud Backup Service for data protection',
      category: 'Storage',
      pricingModel: 'PayAsYouGo',
      unitPriceUSD: 0.02,
      exampleConfig: { backupGB: 200 },
      defaultEstimatedMonthlyCost: 15,
    },
    {
      name: 'CDN',
      description: 'Content Delivery Network for fast content delivery',
      category: 'Networking',
      pricingModel: 'PayAsYouGo',
      unitPriceUSD: 0.03,
      exampleConfig: { trafficTB: 1 },
      defaultEstimatedMonthlyCost: 10,
    },
  ];

  await Service.deleteMany({});
  await Service.insertMany(services);
  await mongoose.disconnect();
  console.log('Seeding complete');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  mongoose.disconnect();
});

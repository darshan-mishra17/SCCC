import mongoose from 'mongoose';
import Service from './models/Service.js';
import connectDB from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const initialServices = [
  {
    name: 'ecs',
    displayName: 'Elastic Compute Service',
    category: 'Compute',
    description: 'Scalable cloud computing instances with various configurations for different workloads',
    unitPrice: 0.12,
    currency: 'USD',
    status: 'active',
    requiredFields: ['instanceType', 'instanceCount', 'storageSize', 'bandwidth'],
    detailedFields: [
      {
        key: 'instanceType',
        label: 'Instance Type',
        type: 'select',
        options: ['ecs.t6.medium', 'ecs.t6.large', 'ecs.g6.large', 'ecs.g6.xlarge', 'ecs.c6.large', 'ecs.c6.xlarge'],
        required: true
      },
      {
        key: 'instanceCount',
        label: 'Number of Instances',
        type: 'number',
        min: 1,
        max: 100,
        required: true
      },
      {
        key: 'storageSize',
        label: 'Storage Size (GB)',
        type: 'number',
        min: 20,
        max: 32768,
        required: true
      },
      {
        key: 'bandwidth',
        label: 'Bandwidth (Mbps)',
        type: 'number',
        min: 1,
        max: 10000,
        required: true
      }
    ],
    pricingModel: 'hourly',
    exampleConfig: {
      instanceType: 'ecs.g6.large',
      instanceCount: 2,
      storageSize: 100,
      bandwidth: 5
    },
    defaultEstimatedMonthlyCost: 350
  },
  {
    name: 'tdsql',
    displayName: 'Tencent Distributed SQL Database',
    category: 'Database',
    description: 'High-performance distributed database service with automatic scaling and backup',
    unitPrice: 120,
    currency: 'USD',
    status: 'active',
    requiredFields: ['engine', 'instanceSize', 'storageSize', 'backupRetention'],
    detailedFields: [
      {
        key: 'engine',
        label: 'Database Engine',
        type: 'select',
        options: ['MySQL', 'PostgreSQL', 'MariaDB'],
        required: true
      },
      {
        key: 'instanceSize',
        label: 'Instance Size',
        type: 'select',
        options: ['small', 'medium', 'large', 'xlarge'],
        required: true
      },
      {
        key: 'storageSize',
        label: 'Storage Size (GB)',
        type: 'number',
        min: 20,
        max: 32768,
        required: true
      },
      {
        key: 'backupRetention',
        label: 'Backup Retention (days)',
        type: 'number',
        min: 1,
        max: 35,
        required: true
      }
    ],
    pricingModel: 'monthly',
    exampleConfig: {
      engine: 'MySQL',
      instanceSize: 'medium',
      storageSize: 100,
      backupRetention: 7
    },
    defaultEstimatedMonthlyCost: 150
  },
  {
    name: 'oss',
    displayName: 'Object Storage Service',
    category: 'Storage',
    description: 'Secure and scalable object storage for data backup, archiving, and content distribution',
    unitPrice: 0.025,
    currency: 'USD',
    status: 'active',
    requiredFields: ['storageClass', 'capacity', 'region'],
    detailedFields: [
      {
        key: 'storageClass',
        label: 'Storage Class',
        type: 'select',
        options: ['Standard', 'IA', 'Archive', 'Cold Archive'],
        required: true
      },
      {
        key: 'capacity',
        label: 'Storage Capacity (GB)',
        type: 'number',
        min: 1,
        max: 1000000,
        required: true
      },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        options: ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'me-south-1'],
        required: true
      }
    ],
    pricingModel: 'monthly',
    exampleConfig: {
      storageClass: 'Standard',
      capacity: 500,
      region: 'me-south-1'
    },
    defaultEstimatedMonthlyCost: 15
  },
  {
    name: 'waf',
    displayName: 'Web Application Firewall',
    category: 'Security',
    description: 'Protect web applications from common attacks and vulnerabilities',
    unitPrice: 0.08,
    currency: 'USD',
    status: 'active',
    requiredFields: ['protectionLevel', 'bandwidth', 'domains'],
    detailedFields: [
      {
        key: 'protectionLevel',
        label: 'Protection Level',
        type: 'select',
        options: ['basic', 'standard', 'premium'],
        required: true
      },
      {
        key: 'bandwidth',
        label: 'Protected Bandwidth (Mbps)',
        type: 'number',
        min: 10,
        max: 10000,
        required: true
      },
      {
        key: 'domains',
        label: 'Number of Domains',
        type: 'number',
        min: 1,
        max: 100,
        required: true
      }
    ],
    pricingModel: 'hourly',
    exampleConfig: {
      protectionLevel: 'standard',
      bandwidth: 100,
      domains: 3
    },
    defaultEstimatedMonthlyCost: 60
  }
];

async function seedServices() {
  try {
    await connectDB();
    
    console.log('🌱 Starting service seeding...');
    
    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing services');
    
    // Insert initial services
    const services = await Service.insertMany(initialServices);
    console.log(`✅ Successfully seeded ${services.length} services:`);
    
    services.forEach(service => {
      console.log(`   - ${service.name} (${service.displayName}) - ${service.category}`);
    });
    
    console.log('🎉 Service seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
seedServices();

// seedDatabase.js
import mongoose from 'mongoose';
import Service from './models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

const services = [
  {
    name: 'ecs',
    displayName: 'Elastic Compute Service (ECS)',
    description: 'Scalable virtual machine instances for compute workloads',
    requiredFields: [
      {
        key: 'instanceType',
        label: 'Instance Type',
        type: 'option',
        options: ['ecs.t6.medium', 'ecs.t6.large', 'ecs.g6.large', 'ecs.g6.xlarge', 'ecs.c6.large', 'ecs.c6.xlarge'],
        description: 'Choose the compute instance size based on your performance needs',
        aiQuestion: 'What type of compute instance do you need? Choose from: ecs.t6.medium (basic), ecs.t6.large (standard), ecs.g6.large (general purpose), ecs.g6.xlarge (high performance), ecs.c6.large (compute optimized), or ecs.c6.xlarge (high compute).'
      },
      {
        key: 'count',
        label: 'Number of Instances',
        type: 'number',
        min: 1,
        max: 50,
        description: 'How many compute instances do you need?',
        aiQuestion: 'How many compute instances do you need? (minimum 1, maximum 50)'
      },
      {
        key: 'diskSize',
        label: 'Disk Size (GB)',
        type: 'number',
        min: 20,
        max: 2000,
        description: 'Storage capacity for each instance',
        aiQuestion: 'How much disk storage do you need for each instance in GB? (minimum 20 GB, maximum 2000 GB)'
      },
      {
        key: 'bandwidth',
        label: 'Network Bandwidth (Mbps)',
        type: 'option',
        options: ['1', '5', '10', '50', '100'],
        description: 'Network bandwidth allocation per instance',
        aiQuestion: 'What network bandwidth do you need per instance? Choose from: 1 Mbps, 5 Mbps, 10 Mbps, 50 Mbps, or 100 Mbps.'
      }
    ],
    pricingModel: 'instance-hours',
    unitPriceUSD: 0.05
  },
  {
    name: 'oss',
    displayName: 'Object Storage Service (OSS)',
    description: 'Scalable object storage for files, backups, and data archiving',
    requiredFields: [
      {
        key: 'storageGB',
        label: 'Storage Capacity (GB)',
        type: 'number',
        min: 1,
        max: 100000,
        description: 'Total storage capacity needed',
        aiQuestion: 'How much storage capacity do you need in GB? (minimum 1 GB, maximum 100,000 GB)'
      },
      {
        key: 'redundancy',
        label: 'Redundancy Level',
        type: 'option',
        options: ['Standard', 'Reduced', 'Glacier'],
        description: 'Data redundancy and availability level',
        aiQuestion: 'What redundancy level do you need? Choose from: Standard (high availability), Reduced (lower cost), or Glacier (archival storage).'
      },
      {
        key: 'region',
        label: 'Storage Region',
        type: 'option',
        options: ['Riyadh', 'Jeddah', 'Dammam'],
        description: 'Geographic location for data storage',
        aiQuestion: 'Which region should store your data? Choose from: Riyadh, Jeddah, or Dammam.'
      }
    ],
    pricingModel: 'storage-gb-month',
    unitPriceUSD: 0.023
  },
  {
    name: 'tdsql',
    displayName: 'TDSQL Database Service',
    description: 'Managed relational database with high availability and performance',
    requiredFields: [
      {
        key: 'engine',
        label: 'Database Engine',
        type: 'option',
        options: ['MySQL 8.0', 'MySQL 5.7', 'PostgreSQL 13', 'PostgreSQL 12'],
        description: 'Database engine and version',
        aiQuestion: 'Which database engine do you prefer? Choose from: MySQL 8.0, MySQL 5.7, PostgreSQL 13, or PostgreSQL 12.'
      },
      {
        key: 'nodes',
        label: 'Number of Database Nodes',
        type: 'number',
        min: 1,
        max: 10,
        description: 'Number of database nodes for scaling and availability',
        aiQuestion: 'How many database nodes do you need for scaling and availability? (minimum 1, maximum 10)'
      },
      {
        key: 'storageGB',
        label: 'Database Storage (GB)',
        type: 'number',
        min: 20,
        max: 10000,
        description: 'Database storage capacity',
        aiQuestion: 'How much database storage do you need in GB? (minimum 20 GB, maximum 10,000 GB)'
      },
      {
        key: 'performanceTier',
        label: 'Performance Tier',
        type: 'option',
        options: ['Basic', 'Standard', 'Premium'],
        description: 'Database performance and resource allocation level',
        aiQuestion: 'What performance tier do you need? Choose from: Basic (cost-effective), Standard (balanced), or Premium (high performance).'
      }
    ],
    pricingModel: 'node-hours',
    unitPriceUSD: 0.15
  }
];

async function seedDatabase() {
  try {
    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing services');

    // Insert new services
    const insertedServices = await Service.insertMany(services);
    console.log('🌱 Seeded database with services:', insertedServices.map(s => s.name));

    // Verify the seeding
    const count = await Service.countDocuments();
    console.log(`✅ Database now contains ${count} services`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase, services };

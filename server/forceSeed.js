import mongoose from 'mongoose';
import Service from './models/Service.js';

console.log('🌱 Force seeding database...');

const mongoUri = 'mongodb+srv://Sccc:SCCC%40abc123@cluster0.yhomiud.mongodb.net/sccc';

const ecsService = {
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
    },
    {
      key: 'operatingSystem',
      label: 'Operating System',
      type: 'option',
      options: ['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 7', 'CentOS 8', 'Windows Server 2019', 'Windows Server 2022'],
      description: 'Operating system for the compute instance',
      aiQuestion: 'Which operating system do you prefer? Choose from: Ubuntu 20.04, Ubuntu 22.04, CentOS 7, CentOS 8, Windows Server 2019, or Windows Server 2022.'
    }
  ],
  pricingModel: 'instance-hours',
  unitPriceUSD: 0.05
};

mongoose.connect(mongoUri)
  .then(() => {
    console.log('📦 Connected to MongoDB');
    return Service.findOneAndUpdate(
      { name: 'ecs' },
      ecsService,
      { upsert: true, new: true }
    );
  })
  .then((result) => {
    console.log('✅ ECS service updated successfully');
    console.log('📊 Fields count:', result.requiredFields.length);
    console.log('🔧 Fields:', result.requiredFields.map(f => f.key));
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

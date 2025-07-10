// services/enhancedPricingEngine.js (ESM)
// Enhanced pricing engine that handles all service types with detailed calculations

export const BASE_PRICES = {
  ecs: {
    hourly: 0.12, // USD per hour base
    disk: 0.05,   // USD per GB per month
    bandwidth: 0.02, // USD per Mbps per hour
  },
  oss: {
    storage: 0.025, // USD per GB per month
    redundancy: {
      'Standard': 1.0,
      'Reduced': 0.7,
      'Glacier': 0.4
    }
  },
  tdsql: {
    nodeHourly: 0.15, // USD per node per hour
    storage: 0.1,     // USD per GB per month
    performance: {
      'Basic': 1.0,
      'Standard': 1.5,
      'Premium': 2.5
    }
  }
};

export const MULTIPLIERS = {
  KSA: 1.6,
  USD_TO_SAR: 3.75,
  VAT_RATE: 0.15,
  HOURS_PER_MONTH: 730
};

// Instance type multipliers for ECS
export const INSTANCE_MULTIPLIERS = {
  'ecs.t6.medium': 0.8,
  'ecs.t6.large': 1.0,
  'ecs.g6.large': 1.5,
  'ecs.g6.xlarge': 2.5,
  'ecs.c6.large': 1.3,
  'ecs.c6.xlarge': 2.2
};

export function calculateECSPricing(fields) {
  console.log('[DEBUG] Calculating ECS pricing for fields:', fields);
  
  const count = parseInt(fields.count) || 1;
  const instanceType = fields.instanceType || 'ecs.g6.large';
  const diskSize = parseInt(fields.diskSize) || 20;
  const bandwidth = parseInt(fields.bandwidth) || 1;
  
  const instanceMultiplier = INSTANCE_MULTIPLIERS[instanceType] || 1.0;
  
  // Calculate monthly costs in USD
  const instanceMonthlyCost = BASE_PRICES.ecs.hourly * instanceMultiplier * MULTIPLIERS.HOURS_PER_MONTH * count;
  const diskMonthlyCost = BASE_PRICES.ecs.disk * diskSize * count;
  const bandwidthMonthlyCost = BASE_PRICES.ecs.bandwidth * bandwidth * MULTIPLIERS.HOURS_PER_MONTH * count;
  
  let subtotalUSD = instanceMonthlyCost + diskMonthlyCost + bandwidthMonthlyCost;
  
  console.log('[DEBUG] ECS cost breakdown:', {
    instanceMonthlyCost,
    diskMonthlyCost,
    bandwidthMonthlyCost,
    subtotalUSD
  });
  
  return convertToSAR(subtotalUSD);
}

export function calculateOSSPricing(fields) {
  console.log('[DEBUG] Calculating OSS pricing for fields:', fields);
  
  const storageGB = parseInt(fields.storageGB) || 0;
  const redundancy = fields.redundancy || 'Standard';
  const redundancyMultiplier = BASE_PRICES.oss.redundancy[redundancy] || 1.0;
  
  let subtotalUSD = BASE_PRICES.oss.storage * storageGB * redundancyMultiplier;
  
  console.log('[DEBUG] OSS cost breakdown:', {
    storageGB,
    redundancy,
    redundancyMultiplier,
    subtotalUSD
  });
  
  return convertToSAR(subtotalUSD);
}

export function calculateTDSQLPricing(fields) {
  console.log('[DEBUG] Calculating TDSQL pricing for fields:', fields);
  
  const nodes = parseInt(fields.nodes) || 1;
  const storageGB = parseInt(fields.storageGB) || 20;
  const performanceTier = fields.performanceTier || 'Standard';
  const performanceMultiplier = BASE_PRICES.tdsql.performance[performanceTier] || 1.0;
  
  const nodesMonthlyCost = BASE_PRICES.tdsql.nodeHourly * performanceMultiplier * MULTIPLIERS.HOURS_PER_MONTH * nodes;
  const storageMonthlyCost = BASE_PRICES.tdsql.storage * storageGB;
  
  let subtotalUSD = nodesMonthlyCost + storageMonthlyCost;
  
  console.log('[DEBUG] TDSQL cost breakdown:', {
    nodesMonthlyCost,
    storageMonthlyCost,
    performanceMultiplier,
    subtotalUSD
  });
  
  return convertToSAR(subtotalUSD);
}

function convertToSAR(subtotalUSD) {
  // Apply KSA multiplier
  subtotalUSD *= MULTIPLIERS.KSA;
  
  // Convert to SAR
  const subtotalSAR = subtotalUSD * MULTIPLIERS.USD_TO_SAR;
  const vatSAR = subtotalSAR * MULTIPLIERS.VAT_RATE;
  const totalMonthlySAR = subtotalSAR + vatSAR;
  
  return {
    subtotalSAR: Math.round(subtotalSAR),
    vatSAR: Math.round(vatSAR),
    totalMonthlySAR: Math.round(totalMonthlySAR)
  };
}

// Main function to calculate pricing for any service
export function calculateServicePricing(serviceName, fields) {
  console.log(`[DEBUG] Calculating pricing for ${serviceName} with fields:`, fields);
  
  switch (serviceName.toLowerCase()) {
    case 'ecs':
      return calculateECSPricing(fields);
    case 'oss':
      return calculateOSSPricing(fields);
    case 'tdsql':
      return calculateTDSQLPricing(fields);
    default:
      console.warn(`[DEBUG] Unknown service type: ${serviceName}`);
      return { subtotalSAR: 0, vatSAR: 0, totalMonthlySAR: 0 };
  }
}

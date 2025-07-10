// logic/pricing.js (ESM)
// Pricing logic for ECS, OSS, TDSQL, etc.

export const BASE_PRICES = {
  ecs: 0.12, // USD/hour per instance
  oss: 0.025, // USD/GB/month
  tdsql: 120, // USD/month per node
};
export const KSA_MULTIPLIER = 1.6;
export const HOURS_PER_MONTH = 730;
export const USD_TO_SAR = 3.75;
export const VAT_RATE = 0.15;

export function calculatePricing(config) {
  console.log('[DEBUG] calculatePricing received config:', config);
  
  let subtotalUSD = 0;
  
  // Support both object (ecs/oss/tdsql) and array (services) input
  if (Array.isArray(config.services)) {
    for (const s of config.services) {
      if (s.service && typeof s === 'object') {
        if (s.service.toLowerCase() === 'ecs') {
          subtotalUSD += (BASE_PRICES.ecs * HOURS_PER_MONTH * (parseInt(s.count) || 1));
        } else if (s.service.toLowerCase() === 'oss') {
          subtotalUSD += (BASE_PRICES.oss * (parseInt(s.storageGB) || 0));
        } else if (s.service.toLowerCase() === 'tdsql') {
          subtotalUSD += (BASE_PRICES.tdsql * (parseInt(s.nodes) || 1));
        }
      }
    }
  } else {
    // Handle direct service field mapping
    if (config.oss) {
      // OSS pricing based on storage capacity
      const storageGB = parseInt(config.oss.storageGB) || 0;
      subtotalUSD += (BASE_PRICES.oss * storageGB);
      console.log('[DEBUG] OSS pricing: storageGB =', storageGB, 'cost =', BASE_PRICES.oss * storageGB);
    }
    if (config.tdsql) {
      // TDSQL pricing based on nodes
      const nodes = parseInt(config.tdsql.nodes) || 1;
      const storageGB = parseInt(config.tdsql.storageGB) || 20;
      subtotalUSD += (BASE_PRICES.tdsql * nodes) + (storageGB * 0.1); // Add storage cost
      console.log('[DEBUG] TDSQL pricing: nodes =', nodes, 'storageGB =', storageGB);
    }
  }
  
  console.log('[DEBUG] Subtotal USD before multipliers:', subtotalUSD);
  
  // Apply KSA multiplier
  subtotalUSD *= KSA_MULTIPLIER;
  // Convert to SAR
  let subtotalSAR = subtotalUSD * USD_TO_SAR;
  // VAT
  let vat = subtotalSAR * VAT_RATE;
  let total = subtotalSAR + vat;
  
  const result = {
    subtotal: Math.round(subtotalSAR),
    vat: Math.round(vat),
    totalMonthlySAR: Math.round(total),
    subtotalSAR: Math.round(subtotalSAR),
    vatSAR: Math.round(vat),
  };
  
  console.log('[DEBUG] Final pricing result:', result);
  return result;
}

// New pricing engine for detailed ECS config
export function calculatePrice(config) {
  console.log('[DEBUG] ECS calculatePrice received config:', config);
  
  // Base prices (USD)
  const ECS_HOURLY = 0.12;
  const DISK_GB = 0.05; // per GB per month
  const BANDWIDTH_Mbps_HOURLY = 0.02;
  const KSA_MULTIPLIER = 1.6;
  const HOURS_PER_MONTH = 730;
  const USD_TO_SAR = 3.75;
  const VAT_RATE = 0.15;

  // Parse config - use the actual field names from the database
  const instanceCount = parseInt(config.count) || 1;
  const instanceType = config.instanceType || 'ecs.g6.large';
  const diskGB = parseInt(config.diskSize) || 20;
  const bandwidth = parseInt(config.bandwidth) || 1;

  console.log('[DEBUG] Parsed values:', { instanceCount, instanceType, diskGB, bandwidth });

  // Instance type multipliers based on the type
  let instanceMultiplier = 1;
  switch (instanceType) {
    case 'ecs.t6.medium': instanceMultiplier = 0.8; break;
    case 'ecs.t6.large': instanceMultiplier = 1; break;
    case 'ecs.g6.large': instanceMultiplier = 1.5; break;
    case 'ecs.g6.xlarge': instanceMultiplier = 2.5; break;
    case 'ecs.c6.large': instanceMultiplier = 1.3; break;
    case 'ecs.c6.xlarge': instanceMultiplier = 2.2; break;
    default: instanceMultiplier = 1;
  }

  // Calculate costs
  const instanceHourlyCost = ECS_HOURLY * instanceMultiplier;
  const bandwidthHourlyCost = bandwidth * BANDWIDTH_Mbps_HOURLY;
  const diskMonthlyCost = diskGB * DISK_GB;
  
  // Total monthly cost in USD
  let subtotalUSD = (instanceHourlyCost * HOURS_PER_MONTH * instanceCount) + 
                    (bandwidthHourlyCost * HOURS_PER_MONTH * instanceCount) + 
                    (diskMonthlyCost * instanceCount);
  
  console.log('[DEBUG] Cost breakdown USD:', {
    instanceMonthlyCost: instanceHourlyCost * HOURS_PER_MONTH * instanceCount,
    bandwidthMonthlyCost: bandwidthHourlyCost * HOURS_PER_MONTH * instanceCount,
    diskMonthlyCost: diskMonthlyCost * instanceCount,
    subtotalUSD
  });

  // Apply KSA multiplier and convert to SAR
  subtotalUSD *= KSA_MULTIPLIER;
  let subtotalSAR = subtotalUSD * USD_TO_SAR;
  let vatSAR = subtotalSAR * VAT_RATE;
  let totalMonthlySAR = subtotalSAR + vatSAR;

  const result = {
    subtotalSAR: Math.round(subtotalSAR),
    vatSAR: Math.round(vatSAR),
    totalMonthlySAR: Math.round(totalMonthlySAR),
  };
  
  console.log('[DEBUG] ECS pricing result:', result);
  return result;
}
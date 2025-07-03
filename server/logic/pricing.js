// logic/pricing.js
// Pricing logic for ECS, OSS, TDSQL, etc.

const BASE_PRICES = {
  ecs: 0.12, // USD/hour per instance
  oss: 0.025, // USD/GB/month
  tdsql: 120, // USD/month per node
};
const KSA_MULTIPLIER = 1.6;
const HOURS_PER_MONTH = 730;
const USD_TO_SAR = 3.75;
const VAT_RATE = 0.15;

function calculatePricing(config) {
  let subtotalUSD = 0;
  // Support both object (ecs/oss/tdsql) and array (services) input
  if (Array.isArray(config.services)) {
    for (const s of config.services) {
      if (s.service && typeof s === 'object') {
        if (s.service.toLowerCase() === 'ecs') {
          subtotalUSD += (BASE_PRICES.ecs * HOURS_PER_MONTH * (s.count || 1));
        } else if (s.service.toLowerCase() === 'oss') {
          subtotalUSD += (BASE_PRICES.oss * (s.storageGB || 0));
        } else if (s.service.toLowerCase() === 'tdsql') {
          subtotalUSD += (BASE_PRICES.tdsql * (s.nodes || 1));
        }
      }
    }
  } else {
    // ECS
    if (config.ecs) {
      subtotalUSD += (BASE_PRICES.ecs * HOURS_PER_MONTH * (config.ecs.count || 1));
    }
    // OSS
    if (config.oss) {
      subtotalUSD += (BASE_PRICES.oss * (config.oss.storageGB || 0));
    }
    // TDSQL
    if (config.tdsql) {
      subtotalUSD += (BASE_PRICES.tdsql * (config.tdsql.nodes || 1));
    }
  }
  // Apply KSA multiplier
  subtotalUSD *= KSA_MULTIPLIER;
  // Convert to SAR
  let subtotalSAR = subtotalUSD * USD_TO_SAR;
  // VAT
  let vat = subtotalSAR * VAT_RATE;
  let total = subtotalSAR + vat;
  return {
    subtotal: +subtotalSAR.toFixed(2),
    vat: +vat.toFixed(2),
    totalMonthlySAR: +total.toFixed(2),
  };
}

// New pricing engine for detailed ECS config
function calculatePrice(config) {
  // Base prices (USD)
  const ECS_HOURLY = 0.12;
  const DISK_GB = 0.05; // per GB per month
  const BANDWIDTH_Mbps_HOURLY = 0.02;
  const KSA_MULTIPLIER = 1.6;
  const HOURS_PER_MONTH = 730;
  const USD_TO_SAR = 3.75;
  const VAT_RATE = 0.15;

  // Parse config
  const instanceCount = config.quantity || 1;
  const instanceType = config.instanceType || 'ecs.g6.large';
  const disks = config.systemDisk ? [config.systemDisk] : [];
  if (Array.isArray(config.dataDisks)) disks.push(...config.dataDisks);
  const diskGB = disks.reduce((sum, d) => sum + (d.sizeGB || 0), 0);
  const bandwidth = config.bandwidthMbps || 0;

  // Hourly cost
  let hourly = ECS_HOURLY + (bandwidth * BANDWIDTH_Mbps_HOURLY / instanceCount);
  // Monthly cost
  let subtotalUSD = (hourly * HOURS_PER_MONTH * instanceCount) + (diskGB * DISK_GB);
  subtotalUSD *= KSA_MULTIPLIER;
  let subtotalSAR = subtotalUSD * USD_TO_SAR;
  let vatSAR = subtotalSAR * VAT_RATE;
  let totalMonthlySAR = subtotalSAR + vatSAR;
  return {
    subtotalSAR: +subtotalSAR.toFixed(2),
    vatSAR: +vatSAR.toFixed(2),
    totalMonthlySAR: +totalMonthlySAR.toFixed(2),
  };
}

module.exports = { calculatePricing, calculatePrice };

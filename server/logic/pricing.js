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
  console.log('[PRICING] Received config:', JSON.stringify(config, null, 2));
  let subtotalUSD = 0;
  // ECS
  if (config.ecs) {
    console.log('[PRICING] ECS config:', config.ecs);
    subtotalUSD += (BASE_PRICES.ecs * HOURS_PER_MONTH * (config.ecs.count || 1));
  }
  // OSS
  if (config.oss) {
    console.log('[PRICING] OSS config:', config.oss);
    subtotalUSD += (BASE_PRICES.oss * (config.oss.storageGB || 0));
  }
  // TDSQL
  if (config.tdsql) {
    console.log('[PRICING] TDSQL config:', config.tdsql);
    subtotalUSD += (BASE_PRICES.tdsql * (config.tdsql.nodes || 1));
  }
  // Add: handle generic service keys for more flexible AI output
  for (const [key, value] of Object.entries(config)) {
    if (key === 'ecs' || key === 'oss' || key === 'tdsql') continue;
    if (value && typeof value === 'object') {
      if (value.instanceType && value.count) {
        console.log(`[PRICING] Generic ECS-like config for key ${key}:`, value);
        subtotalUSD += (BASE_PRICES.ecs * HOURS_PER_MONTH * value.count);
      }
      if (value.storageGB) {
        console.log(`[PRICING] Generic OSS-like config for key ${key}:`, value);
        subtotalUSD += (BASE_PRICES.oss * value.storageGB);
      }
      if (value.nodes) {
        console.log(`[PRICING] Generic TDSQL-like config for key ${key}:`, value);
        subtotalUSD += (BASE_PRICES.tdsql * value.nodes);
      }
    }
  }
  // Apply KSA multiplier
  subtotalUSD *= KSA_MULTIPLIER;
  // Convert to SAR
  let subtotalSAR = subtotalUSD * USD_TO_SAR;
  // VAT
  let vat = subtotalSAR * VAT_RATE;
  let total = subtotalSAR + vat;
  console.log('[PRICING] Calculated:', { subtotalUSD, subtotalSAR, vat, total });
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

// logic/pricing.js (ESM)
// Dynamic pricing logic that fetches services from database

import Service from '../models/Service.js';

export const KSA_MULTIPLIER = 1.6;
export const HOURS_PER_MONTH = 730;
export const USD_TO_SAR = 3.75;
export const VAT_RATE = 0.15;

// Fallback prices if database is unavailable
export const FALLBACK_PRICES = {
  ecs: 0.12, // USD/hour per instance
  oss: 0.025, // USD/GB/month
  tdsql: 120, // USD/month per node
};

async function getServicePrices() {
  try {
    const services = await Service.find({ status: 'active' });
    const prices = {};
    
    services.forEach(service => {
      prices[service.name.toLowerCase()] = {
        unitPrice: service.unitPrice,
        currency: service.currency || 'USD',
        requiredFields: service.requiredFields || [],
        name: service.name,
        displayName: service.displayName || service.name
      };
    });
    
    console.log('[DEBUG] Loaded service prices from database:', Object.keys(prices));
    return prices;
  } catch (error) {
    console.error('[ERROR] Failed to load service prices from database:', error);
    return FALLBACK_PRICES;
  }
}

export async function calculatePricing(config) {
  console.log('[DEBUG] calculatePricing received config:', config);
  
  const servicePrices = await getServicePrices();
  let subtotalUSD = 0;
  const serviceBreakdown = [];
  
  // Support both object (ecs/oss/tdsql) and array (services) input
  if (Array.isArray(config.services) || Array.isArray(config.recommendedServices)) {
    const services = config.services || config.recommendedServices || [];
    
    for (const serviceConfig of services) {
      const serviceName = serviceConfig.name || serviceConfig.service;
      const serviceData = servicePrices[serviceName.toLowerCase()];
      
      if (!serviceData) {
        console.warn(`[WARNING] No pricing data found for service: ${serviceName}`);
        continue;
      }
      
      let serviceCost = 0;
      const config = serviceConfig.config || serviceConfig;
      
      // Calculate cost based on service type and configuration
      switch (serviceName.toLowerCase()) {
        case 'ecs':
          const instanceCount = parseInt(config.instanceCount || config.count) || 1;
          const instanceType = config.instanceType || 'ecs.g6.large';
          const diskSize = parseInt(config.diskSize || config.storageSize) || 40;
          const bandwidth = parseInt(config.bandwidth) || 1;
          
          // Instance type multipliers
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
          
          const instanceHourlyCost = serviceData.unitPrice * instanceMultiplier;
          const bandwidthHourlyCost = bandwidth * 0.02;
          const diskMonthlyCost = diskSize * 0.05;
          
          serviceCost = (instanceHourlyCost * HOURS_PER_MONTH * instanceCount) + 
                       (bandwidthHourlyCost * HOURS_PER_MONTH * instanceCount) + 
                       (diskMonthlyCost * instanceCount);
          break;
          
        case 'oss':
          const storageGB = parseInt(config.storageGB || config.capacity) || 0;
          serviceCost = serviceData.unitPrice * storageGB;
          break;
          
        case 'tdsql':
          const nodes = parseInt(config.nodes || config.instanceCount) || 1;
          const dbStorageGB = parseInt(config.storageGB || config.storageSize) || 20;
          serviceCost = (serviceData.unitPrice * nodes) + (dbStorageGB * 0.1);
          break;
          
        case 'waf':
          const domains = parseInt(config.domains) || 1;
          const protectionLevel = config.protectionLevel || 'standard';
          let wafMultiplier = protectionLevel === 'premium' ? 2 : 1;
          serviceCost = serviceData.unitPrice * domains * wafMultiplier * HOURS_PER_MONTH;
          break;
          
        default:
          // Generic calculation for other services
          const quantity = parseInt(config.quantity || config.count || config.instances) || 1;
          serviceCost = serviceData.unitPrice * quantity * HOURS_PER_MONTH;
          break;
      }
      
      subtotalUSD += serviceCost;
      serviceBreakdown.push({
        name: serviceName,
        displayName: serviceData.displayName,
        cost: serviceCost,
        config: config
      });
      
      console.log(`[DEBUG] ${serviceName} pricing: cost USD = ${serviceCost}`);
    }
  } else {
    // Handle legacy direct service field mapping
    for (const [serviceName, serviceConfig] of Object.entries(config)) {
      if (serviceName.startsWith('_') || !serviceConfig) continue;
      
      const serviceData = servicePrices[serviceName.toLowerCase()];
      if (!serviceData) continue;
      
      let serviceCost = 0;
      
      switch (serviceName.toLowerCase()) {
        case 'ecs':
          const instanceCount = parseInt(serviceConfig.count || serviceConfig.instanceCount) || 1;
          serviceCost = serviceData.unitPrice * HOURS_PER_MONTH * instanceCount;
          break;
        case 'oss':
          const storageGB = parseInt(serviceConfig.storageGB) || 0;
          serviceCost = serviceData.unitPrice * storageGB;
          break;
        case 'tdsql':
          const nodes = parseInt(serviceConfig.nodes) || 1;
          serviceCost = serviceData.unitPrice * nodes;
          break;
        default:
          serviceCost = serviceData.unitPrice * HOURS_PER_MONTH;
          break;
      }
      
      subtotalUSD += serviceCost;
      serviceBreakdown.push({
        name: serviceName,
        displayName: serviceData.displayName,
        cost: serviceCost,
        config: serviceConfig
      });
    }
  }
  
  console.log('[DEBUG] Subtotal USD before multipliers:', subtotalUSD);
  console.log('[DEBUG] Service breakdown:', serviceBreakdown);
  
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
    serviceBreakdown: serviceBreakdown.map(s => ({
      ...s,
      costSAR: Math.round(s.cost * KSA_MULTIPLIER * USD_TO_SAR)
    }))
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
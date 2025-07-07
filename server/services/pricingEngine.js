
// Placeholder: In real use, fetch pricing rules from MongoDB
const basePricing = {
  ECS: { base: 100, perGB: 2, perMbps: 5 },
  OSS: { base: 20, perGB: 0.2 },
  TDSQL: { base: 80, perGB: 1.5 }
};
const KSA_MULTIPLIER = 1.15;
const HOURS_PER_MONTH = 730;
const EXCHANGE_RATE = 1; // Assume SAR for now
const VAT_RATE = 0.15;

function calculatePrice(state) {
  let subtotal = 0;
  if (state.service === 'ECS') {
    const disk = parseInt(state.systemDisk, 10) || 0;
    const bandwidth = parseInt(state.bandwidth, 10) || 0;
    subtotal = basePricing.ECS.base + (disk * basePricing.ECS.perGB) + (bandwidth * basePricing.ECS.perMbps);
    subtotal *= KSA_MULTIPLIER;
    subtotal *= EXCHANGE_RATE;
  } else if (state.service === 'OSS') {
    const capacity = parseInt(state.capacity, 10) || 0;
    subtotal = basePricing.OSS.base + (capacity * basePricing.OSS.perGB);
    subtotal *= KSA_MULTIPLIER;
    subtotal *= EXCHANGE_RATE;
  } else if (state.service === 'TDSQL') {
    const storage = parseInt(state.storage, 10) || 0;
    subtotal = basePricing.TDSQL.base + (storage * basePricing.TDSQL.perGB);
    subtotal *= KSA_MULTIPLIER;
    subtotal *= EXCHANGE_RATE;
  }
  // Assume subtotal is monthly
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;
  return {
    estimatedMonthlyCost: Math.round(subtotal),
    subtotalSAR: Math.round(subtotal),
    vatSAR: Math.round(vat),
    totalMonthlySAR: Math.round(total)
  };
}

export { calculatePrice };

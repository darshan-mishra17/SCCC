
export type Message = {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
};

export type ServiceSuggestion = {
  service: string;
  quantity: number;
  instanceType: string;
  operatingSystem: string;
  systemDisk: {
    sizeGB: number;
    category: string;
  };
  additionalDataDisks: Array<{
    sizeGB: number;
    category: string;
  }>;
  bandwidthMbps: number;
  pricingModel: string;
  defaultEstimatedMonthlyCost: number;
};

export type CostSummary = {
  subtotal: number;
  vat: number;
  total: number;
};

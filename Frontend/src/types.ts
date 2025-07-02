export type ChatMessage = { sender: 'user' | 'ai'; text: string };
export type AIConfig = {
  service: string;
  instanceType: string;
  systemDisk: object;
  bandwidthMbps: number;
  pricingModel: string;
};
export type PricingResult = {
  subtotalSAR: number;
  vatSAR: number;
  totalMonthlySAR: number;
};

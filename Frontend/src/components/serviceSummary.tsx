import React from 'react';

type Pricing = {
  subtotalSAR: number;
  vatSAR: number;
  totalMonthlySAR: number;
};

type ServiceConfig = {
  service: string;
  [key: string]: any;
};

type Props = {
  serviceConfig: ServiceConfig;
  pricing: Pricing;
};

const formatConfig = (config: ServiceConfig) => {
  // Exclude service and isComplete fields
  return Object.entries(config)
    .filter(([k]) => k !== 'service' && k !== 'isComplete')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
};

const serviceNameMap: Record<string, string> = {
  ECS: 'Elastic Compute Service (ECS)',
  OSS: 'Object Storage Service (OSS)',
  TDSQL: 'TDSQL',
};

const ServiceSummary: React.FC<Props> = ({ serviceConfig, pricing }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <div className="mb-4">
        <div className="text-lg font-semibold text-gray-800 mb-1">
          Service Name: {serviceNameMap[serviceConfig.service] || serviceConfig.service}
        </div>
        <div className="text-gray-600 mb-2">
          Config: {formatConfig(serviceConfig)}
        </div>
      </div>
      <div className="bg-blue-50 rounded p-4 flex flex-col gap-2">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span>SAR {pricing.subtotalSAR}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>VAT (15%):</span>
          <span>SAR {pricing.vatSAR}</span>
        </div>
        <div className="flex justify-between text-blue-700 font-bold text-lg mt-2">
          <span>Estimated Monthly:</span>
          <span>SAR {pricing.totalMonthlySAR}</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceSummary;

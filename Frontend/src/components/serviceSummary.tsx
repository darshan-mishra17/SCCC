import React from 'react';

type Pricing = {
  subtotalSAR: number;
  vatSAR: number;
  totalMonthlySAR: number;
};

type Service = {
  name: string;
  config: Record<string, any>;
  monthlyCost: number;
};

type Props = {
  services: Service[];
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
  ecs: 'Elastic Compute Service (ECS)',
  oss: 'Object Storage Service (OSS)',
  tdsql: 'Relational Database Service (RDS)',
  rds: 'Relational Database Service (RDS)',
  waf: 'Web Application Firewall (WAF)',
  slb: 'Server Load Balancer (SLB)',
};

const serviceIcons: Record<string, string> = {
  ecs: '🖥️',
  oss: '🗄️',
  tdsql: '🗃️',
  rds: '🗃️',
  waf: '🛡️',
  slb: '🔀',
};

const ServiceSummary: React.FC<Props> = ({ services, pricing }) => {
  // DEBUG: Log props
  console.log('[DEBUG] ServiceSummary props:', { services, pricing });
  if (!services || services.length === 0) {
    return <div className="text-red-600 font-bold p-8">No services to display. (Debug: {JSON.stringify(services)})</div>;
  }
  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-2xl font-bold text-gray-800 mb-4">AI Suggested Solution & Estimate</div>
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto pb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {services.map((service, idx) => (
          <div key={service.name + idx} className="bg-white rounded-xl shadow border border-gray-100 p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{serviceIcons[service.name.toLowerCase()] || '💡'}</span>
              <span className="font-semibold text-blue-700 text-lg">
                {serviceNameMap[service.name.toLowerCase()] || service.name}
              </span>
            </div>
            <div className="text-gray-500 text-sm mb-1">
              {Object.entries(service.config).map(([k, v]) => (
                <span key={k} className="inline-block mr-2">{k}: {v}</span>
              ))}
            </div>
            <div className="font-bold text-blue-700 mt-2">Est. SAR {service.monthlyCost}/month</div>
          </div>
        ))}
      </div>
      <div className="mt-auto bg-white rounded-xl shadow border border-gray-100 p-5 flex flex-col gap-2 sticky bottom-0 z-10">
        <div className="flex justify-between text-gray-700 text-base">
          <span>Subtotal:</span>
          <span className="font-medium">SAR {pricing.subtotalSAR}</span>
        </div>
        <div className="flex justify-between text-gray-700 text-base">
          <span>VAT (15%):</span>
          <span className="font-medium">SAR {pricing.vatSAR}</span>
        </div>
        <div className="flex justify-between text-blue-900 font-bold text-2xl mt-2">
          <span>Total Estimated Monthly Cost:</span>
          <span className="text-2xl font-bold text-orange-600">SAR {pricing.totalMonthlySAR}</span>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded shadow transition">Accept & Finalize Estimate</button>
          <button className="bg-white border border-orange-400 text-orange-500 font-semibold px-6 py-2 rounded shadow transition">Request Alternative</button>
          <button className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-2 rounded shadow transition">Manually Adjust</button>
        </div>
      </div>
    </div>
  );
};

export default ServiceSummary;

import React from 'react';

import type { ServiceSuggestion } from './types';

interface ServiceCardProps {
  service: ServiceSuggestion;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <div className="solution-card bg-white border border-[#E0E0E0] rounded-lg p-4 mb-3">
      <h4 className="font-semibold text-gray-700">{service.service}</h4>
      <div className="text-xs text-gray-500 mb-1">
        {service.instanceType && <span>Type: {service.instanceType} | </span>}
        {service.operatingSystem && <span>OS: {service.operatingSystem} | </span>}
        {service.systemDisk?.sizeGB ? <span>System Disk: {service.systemDisk.sizeGB}GB {service.systemDisk.category}</span> : null}
      </div>
      {service.additionalDataDisks && service.additionalDataDisks.length > 0 && (
        <div className="text-xs text-gray-500 mb-1">
          Data Disks: {service.additionalDataDisks.map((d: { sizeGB: number; category: string }) => `${d.sizeGB}GB ${d.category}`).join(', ')}
        </div>
      )}
      {service.bandwidthMbps ? (
        <div className="text-xs text-gray-500 mb-1">Bandwidth: {service.bandwidthMbps} Mbps</div>
      ) : null}
      <div className="text-xs text-gray-500 mb-1">Pricing Model: {service.pricingModel}</div>
      <div className="text-sm font-semibold text-[#FF6A00]">Est. SAR {service.defaultEstimatedMonthlyCost?.toFixed(2)}/month</div>
    </div>
  );
};

export default ServiceCard;

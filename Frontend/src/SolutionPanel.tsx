import React from 'react';

import type { ServiceSuggestion, CostSummary } from './types';
import ServiceCard from './ServiceCard';

interface SolutionPanelProps {
  solution: ServiceSuggestion[];
  costSummary: CostSummary;
}

const SolutionPanel: React.FC<SolutionPanelProps> = ({ solution, costSummary }) => {
  return (
    <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden" style={{ minHeight: 400, height: 'calc(100vh - 120px)' }}>
      <div className="p-4 border-b border-[#E0E0E0]">
        <h2 className="text-lg font-semibold text-gray-700">AI Suggested Solution & Estimate</h2>
      </div>
      <div className="flex-grow p-4 space-y-3 overflow-y-auto">
        {solution.length === 0 ? (
          <p className="text-gray-500 text-sm">The AI will suggest services and configurations here based on your conversation.</p>
        ) : (
          solution.map((svc, idx) => <ServiceCard key={idx} service={svc} />)
        )}
      </div>
      <div className="p-4 border-t border-[#E0E0E0] bg-gray-50">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Subtotal:</span>
            <span className="font-semibold">SAR {costSummary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>VAT (15%):</span>
            <span className="font-semibold">SAR {costSummary.vat.toFixed(2)}</span>
          </div>
          <hr className="my-2 border-gray-200" />
          <div className="flex justify-between text-lg font-bold text-[#FF6A00]">
            <span>Total Estimated Monthly Cost:</span>
            <span>SAR {costSummary.total.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button className="btn-primary text-sm bg-[#FF6A00] text-white px-5 py-2 rounded-md font-semibold hover:bg-[#E65C00]">Accept & Finalize Estimate</button>
          <button className="btn-secondary text-sm bg-gray-100 text-gray-700 px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-200">Request Alternative</button>
          <button className="btn-secondary text-sm bg-gray-100 text-gray-700 px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-200">Manually Adjust</button>
        </div>
      </div>
    </div>
  );
};

export default SolutionPanel;

import React from 'react';

interface Service {
  name: string;
  description: string;
  price: string;
}

interface SuggestionPanelProps {
  services: Service[];
  subtotal: string;
  vat: string;
  total: string;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ services, subtotal, vat, total }) => {
  return (
    <div className="bg-white flex flex-col h-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">AI Suggested Solution & Estimate</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {services.map((service, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-medium text-gray-800 mb-1">{service.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
            <p className="text-sm font-medium text-blue-600">Est. {service.price}</p>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2 mb-4 bg-white p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-800">{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">VAT (15%):</span>
            <span className="font-medium text-gray-800">{vat}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
            <span className="text-gray-800">Total Estimated Monthly Cost:</span>
            <span className="text-orange-600">{total}</span>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Accept & Finalize
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-400">
            Manually Adjust
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-400">
            Request Alternative
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default SuggestionPanel;
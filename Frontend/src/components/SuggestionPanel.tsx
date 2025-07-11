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
  onDeleteService?: (index: number) => void;
  onClearAllServices?: () => void;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ services, subtotal, vat, total, onDeleteService, onClearAllServices }) => {
  return (
    <div className="bg-white flex flex-col h-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">AI Suggested Solution & Estimate</h2>
          {onClearAllServices && services.length > 0 && (
            <button
              onClick={onClearAllServices}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md text-sm font-medium transition-colors border border-red-200"
              title="Clear all services"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {services.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No services configured yet.</p>
            <p className="text-gray-400 text-xs mt-1">Start a conversation to get AI suggestions.</p>
          </div>
        ) : (
          services.map((service, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-gray-800">{service.name}</h3>
                {onDeleteService && (
                  <button
                    onClick={() => onDeleteService(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors"
                    title="Remove this service"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
              <p className="text-sm font-medium text-blue-600">Est. {service.price}</p>
            </div>
          ))
        )}
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
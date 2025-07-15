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
  onDeleteService: (index: number) => void;
  onClearAll: () => void;
  onAcceptAndFinalize: () => void;
  onRequestAlternative?: () => void;
  onManualAdjust?: (serviceIndex: number) => void;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ 
  services, 
  subtotal, 
  vat, 
  total, 
  onDeleteService, 
  onClearAll, 
  onAcceptAndFinalize,
  onRequestAlternative,
  onManualAdjust
}) => {
  return (
    <div className="bg-white flex flex-col h-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">AI Suggested Solution & Estimate</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {services.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Start a conversation to get AI-powered service recommendations</p>
          </div>
        ) : (
          services.map((service, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                  <p className="text-sm font-medium text-blue-600">{service.price}</p>
                </div>
                <button
                  onClick={() => onDeleteService(index)}
                  className="ml-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete this service"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
        
        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2">
            {services.length > 0 && (
              <button 
                onClick={onClearAll}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-red-300"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {services.length > 0 && (
              <>
                <button 
                  onClick={onRequestAlternative}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-400"
                  title="Request alternative service recommendations"
                >
                  Request Alternative
                </button>
                <button 
                  onClick={() => onManualAdjust && onManualAdjust(0)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-400"
                  title="Manually adjust service configurations"
                >
                  Manual Adjust
                </button>
              </>
            )}
            <button 
              onClick={onAcceptAndFinalize}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={services.length === 0}
            >
              Accept & Finalize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionPanel;
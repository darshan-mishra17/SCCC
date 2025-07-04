import React, { useState } from 'react';
import ChatBot from './components/chatBot';
import ServiceSummary from './components/serviceSummary';

type ServiceConfig = {
  service: string;
  [key: string]: any;
};

type Pricing = {
  subtotalSAR: number;
  vatSAR: number;
  totalMonthlySAR: number;
};

const App: React.FC = () => {
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);

  // Handler to receive final config and pricing from ChatBot
  const handleFinalConfig = (config: ServiceConfig, price: Pricing) => {
    setServiceConfig(config);
    setPricing(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm py-3 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <img src="https://placehold.co/150x35/FF6A00/FFFFFF?text=SCCC+AI+Advisor&font=Inter" alt="SCCC AI Advisor Logo" className="h-8 mr-3" />
          </div>
          <span className="text-sm text-gray-500">Sales Agent: Hiba</span>
        </div>
      </header>
      {/* Main */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 h-full">
          <div className="w-full md:w-1/2 lg:w-2/5">
            <ChatBot onFinalConfig={handleFinalConfig} />
          </div>
          <div className="w-full md:w-1/2 lg:w-3/5">
            {serviceConfig && pricing ? (
              <ServiceSummary serviceConfig={serviceConfig} pricing={pricing} />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto flex items-center justify-center h-full text-gray-400 text-lg">
                Service summary will appear here after configuration is complete.
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-3 mt-auto">
        <p className="text-xs">&copy; 2025 SCCC Alibaba Cloud KSA - AI Pricing & Solution Advisor</p>
      </footer>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import ChatBot from './components/chatBot';
import ServiceSummary from './components/serviceSummary';

type Service = {
  name: string;
  config: Record<string, any>;
  monthlyCost: number;
};

type Pricing = {
  subtotalSAR: number;
  vatSAR: number;
  totalMonthlySAR: number;
};

const App: React.FC = () => {
  const [services, setServices] = useState<Service[] | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);

  // DEBUG: Log state on every render
  console.log('[DEBUG] App state:', { services, pricing });

  // Handler to receive final config and pricing from ChatBot
  const handleFinalConfig = (services: Service[], pricing: Pricing) => {
    console.log('[DEBUG] handleFinalConfig received:', { services, pricing });
    setServices(services);
    setPricing(pricing);
  };

  return (
    <div className="min-h-screen flex flex-col font-inter bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 shadow-sm py-3 sticky top-0 z-20 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <img src="https://placehold.co/150x35/FF6A00/FFFFFF?text=SCCC+AI+Advisor&font=Inter" alt="SCCC AI Advisor Logo" className="h-8 mr-3 rounded" />
          </div>
          <span className="text-sm text-gray-500 font-medium">Sales Agent: Hiba</span>
        </div>
      </header>
      {/* Main */}
      <main className="flex-grow container mx-auto px-2 sm:px-6 lg:px-12 py-6 flex flex-col md:flex-row gap-8">
        {/* Chat Panel */}
        <section className="w-full md:w-1/2 lg:w-2/5 flex flex-col h-[80vh] bg-white/80 rounded-3xl shadow-xl p-0 md:p-4 backdrop-blur-md border border-blue-100">
          <ChatBot onFinalConfig={handleFinalConfig} />
        </section>
        {/* Summary Panel */}
        <section className="w-full md:w-1/2 lg:w-3/5 flex flex-col h-[80vh]">
          {Array.isArray(services) && pricing ? (
            <ServiceSummary services={services} pricing={pricing} />
          ) : services && pricing ? (
            <div className="text-red-600 font-bold p-8">Error: services is not an array. Debug: {JSON.stringify(services)}</div>
          ) : (
            <div className="bg-white/80 rounded-3xl shadow-xl flex items-center justify-center h-full text-gray-400 text-lg border border-orange-100">
              Service summary will appear here after configuration is complete.
            </div>
          )}
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-3 mt-auto shadow-inner">
        <p className="text-xs tracking-wide">&copy; 2025 SCCC Alibaba Cloud KSA - AI Pricing & Solution Advisor</p>
      </footer>
    </div>
  );
};

export default App;

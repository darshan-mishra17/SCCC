import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ChatBot from './components/chatBot';
import SuggestionPanel from './components/SuggestionPanel';

interface Service {
  name: string;
  description: string;
  price: string;
}

interface Pricing {
  subtotal?: number;
  vat?: number;
  totalMonthlySAR?: number;
}

const App: React.FC = () => {
  const [services, setServices] = useState<Service[] | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [originalServicesData, setOriginalServicesData] = useState<any[] | null>(null);

  // Helper function to transform services data and calculate pricing
  const transformAndCalculateServices = (servicesData: any[]) => {
    let calculatedSubtotal = 0;
    
    // Transform services data to match SuggestionPanel interface
    const transformedServices: Service[] = servicesData.map(service => {
      // Build detailed description from all collected fields
      let description = '';
      if (service.config && typeof service.config === 'object') {
        const fieldDescriptions: string[] = [];
        
        // Format each field with proper labels
        Object.entries(service.config).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            let label = '';
            let formattedValue = value;
            
            // Convert key to readable label
            switch (key.toLowerCase()) {
              case 'instancetype':
                label = 'Instance Type';
                break;
              case 'count':
              case 'numberofinstances':
                label = 'Number of Instances';
                break;
              case 'disksize':
              case 'storagesize':
              case 'storagegb':
                label = 'Storage Size';
                formattedValue = `${value} GB`;
                break;
              case 'operatingsystem':
                label = 'Operating System';
                break;
              case 'bandwidth':
                label = 'Bandwidth';
                formattedValue = `${value} Mbps`;
                break;
              case 'region':
                label = 'Region';
                break;
              case 'disktype':
                label = 'Disk Type';
                break;
              case 'storageclass':
                label = 'Storage Class';
                break;
              case 'redundancy':
                label = 'Redundancy';
                break;
              case 'accessfrequency':
                label = 'Access Frequency';
                break;
              case 'databasetype':
                label = 'Database Type';
                break;
              case 'databaseversion':
                label = 'Database Version';
                break;
              case 'cpucores':
                label = 'CPU Cores';
                break;
              case 'engine':
                label = 'Database Engine';
                break;
              case 'nodes':
                label = 'Number of Database Nodes';
                break;
              case 'performancetier':
                label = 'Performance Tier';
                break;
              case 'memory':
                label = 'Memory';
                formattedValue = `${value} GB`;
                break;
              default:
                // Convert camelCase to readable format
                label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            }
            
            fieldDescriptions.push(`${label}: ${formattedValue}`);
          }
        });
        
        description = fieldDescriptions.join(', ');
      }
      
      // Fallback to simple description if no config fields
      if (!description) {
        description = service.description || `${service.config?.instanceType || ''} ${service.config?.operatingSystem || ''}`.trim() || 'Service configuration';
      }
      
      // Add this service's cost to the subtotal
      const serviceCost = service.monthlyCost || 0;
      calculatedSubtotal += serviceCost;
      
      return {
        name: service.name || service.service || 'Unknown Service',
        description: description,
        price: `SAR ${serviceCost.toFixed(2)}/month`
      };
    });
    
    // Calculate VAT (15%) and total
    const calculatedVAT = calculatedSubtotal * 0.15;
    const calculatedTotal = calculatedSubtotal + calculatedVAT;
    
    // Create corrected pricing object
    const correctedPricing: Pricing = {
      subtotal: calculatedSubtotal,
      vat: calculatedVAT,
      totalMonthlySAR: calculatedTotal
    };
    
    return { transformedServices, correctedPricing };
  };

  // Handler to delete a service
  const handleDeleteService = (indexToDelete: number) => {
    if (!originalServicesData) return;
    
    // Remove the service from the original data
    const updatedServicesData = originalServicesData.filter((_, index) => index !== indexToDelete);
    
    // Recalculate everything
    const { transformedServices, correctedPricing } = transformAndCalculateServices(updatedServicesData);
    
    // Update state
    setOriginalServicesData(updatedServicesData);
    setServices(transformedServices);
    setPricing(correctedPricing);
    
    console.log('[DEBUG] Service deleted, updated pricing:', correctedPricing);
  };

  // Handler to clear all services
  const handleClearAllServices = () => {
    setServices([]);
    setPricing(null);
    setOriginalServicesData([]);
    console.log('[DEBUG] All services cleared');
  };

  // Handler to receive final config and pricing from ChatBot
  const handleFinalConfig = (servicesData: any[], pricingData: Pricing) => {
    console.log('[DEBUG] handleFinalConfig received:', { servicesData, pricingData });
    console.log('[DEBUG] pricingData properties:', {
      subtotal: pricingData?.subtotal,
      vat: pricingData?.vat,
      totalMonthlySAR: pricingData?.totalMonthlySAR
    });
    console.log('[DEBUG] servicesData configs:', servicesData.map(s => ({ name: s.name, config: s.config })));
    
    // Check if we have existing services to append to
    const existingServicesData = originalServicesData || [];
    
    // Append new services to existing ones
    const allServicesData = [...existingServicesData, ...servicesData];
    
    console.log('[DEBUG] Appending services. Existing:', existingServicesData.length, 'New:', servicesData.length, 'Total:', allServicesData.length);
    
    // Store updated original services data for delete functionality
    setOriginalServicesData(allServicesData);
    
    // Transform and calculate using the helper function with all services
    const { transformedServices, correctedPricing } = transformAndCalculateServices(allServicesData);
    
    console.log('[DEBUG] Corrected pricing calculation:', {
      subtotal: correctedPricing.subtotal,
      vat: correctedPricing.vat,
      total: correctedPricing.totalMonthlySAR
    });
    
    setServices(transformedServices);
    setPricing(correctedPricing);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 md:p-8 mt-[3rem] bg-gray-100 overflow-auto">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-[40%_58%] gap-8">
          <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
            <div className="bg-white flex flex-col h-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">AI Consultation Chat</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatBot onFinalConfig={handleFinalConfig} />
              </div>
            </div>
          </div>
          <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
            <SuggestionPanel 
              services={services || []}
              subtotal={pricing && pricing.subtotal ? `SAR ${pricing.subtotal.toFixed(2)}` : "SAR 0.00"}
              vat={pricing && pricing.vat ? `SAR ${pricing.vat.toFixed(2)}` : "SAR 0.00"}
              total={pricing && pricing.totalMonthlySAR ? `SAR ${pricing.totalMonthlySAR.toFixed(2)}` : "SAR 0.00"}
              onDeleteService={handleDeleteService}
              onClearAllServices={handleClearAllServices}
            />
          </div>
        </div>
      </div>
      <footer className="bg-gray-800 text-white py-3 text-center text-xs">
        © 2025 SCCC Alibaba Cloud KSA - AI Pricing & Solution Advisor
      </footer>
    </div>
  );
};

export default App;
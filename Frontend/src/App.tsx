import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatBot from './components/chatBot';
import SuggestionPanel from './components/SuggestionPanel';
import FinalQuotationPage from './components/FinalQuotationPage';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import UserDashboard from './components/UserDashboard';
import { authAPI } from './api';

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

type AppView = 'landing' | 'login' | 'signup' | 'dashboard' | 'chat' | 'finalQuotation';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [showFinalQuotation, setShowFinalQuotation] = useState(false);

  // Check for stored authentication on app startup
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');
    
    if (storedUser && authToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  // Navigation handlers
  const handleShowLogin = () => setCurrentView('login');
  const handleShowSignup = () => setCurrentView('signup');
  const handleShowLanding = () => setCurrentView('landing');

  // Authentication handlers
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        setUser(response.user);
        setCurrentView('dashboard');
      } else {
        alert(response.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      alert(errorMessage);
    }
  };

  const handleSignup = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    password: string;
  }) => {
    try {
      const response = await authAPI.signup(userData);
      
      if (response.success) {
        setUser(response.user);
        setCurrentView('dashboard');
      } else {
        alert(response.message || 'Signup failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      const errorMessage = error.response?.data?.message || 'Signup failed. Please try again.';
      alert(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setServices(null);
      setPricing(null);
      setShowFinalQuotation(false);
      setCurrentView('landing');
    }
  };

  // Dashboard handlers
  const handleStartNewChat = () => {
    setCurrentView('chat');
  };

  const handleReopenChat = (sessionId: string) => {
    // For now, just navigate to chat. In the future, you could load specific session data
    console.log('Reopening chat session:', sessionId);
    setCurrentView('chat');
  };

  const handleViewProfile = () => {
    // For now, just show an alert. In the future, you could add a profile editing modal
    alert('Profile editing coming soon!');
  };

  const handleTryAdvisor = () => {
    // Allow users to try the advisor without signing up
    setCurrentView('chat');
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
    
    // Calculate correct pricing: sum of service costs = subtotal, then add VAT
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
    
    // Calculate VAT (15%) and total for the new services
    const calculatedVAT = calculatedSubtotal * 0.15;
    const calculatedTotal = calculatedSubtotal + calculatedVAT;
    
    console.log('[DEBUG] New services pricing calculation:', {
      subtotal: calculatedSubtotal,
      vat: calculatedVAT,
      total: calculatedTotal
    });
    
    // Append new services to existing ones instead of replacing
    setServices(prevServices => {
      const existingServices = prevServices || [];
      return [...existingServices, ...transformedServices];
    });
    
    // Update pricing to include existing services cost
    setPricing(prevPricing => {
      const existingSubtotal = prevPricing?.subtotal || 0;
      const newSubtotal = existingSubtotal + calculatedSubtotal;
      const newVAT = newSubtotal * 0.15;
      const newTotal = newSubtotal + newVAT;
      
      return {
        subtotal: newSubtotal,
        vat: newVAT,
        totalMonthlySAR: newTotal
      };
    });
  };

  // Handler to delete individual service
  const deleteService = (index: number) => {
    if (!services) return;
    
    // Remove service from array
    const updatedServices = services.filter((_, i) => i !== index);
    
    // Recalculate pricing
    if (updatedServices.length === 0) {
      // If no services left, reset everything
      setServices([]);
      setPricing({ subtotal: 0, vat: 0, totalMonthlySAR: 0 });
    } else {
      // Recalculate pricing based on remaining services
      let newSubtotal = 0;
      updatedServices.forEach(service => {
        // Extract price from service.price string (format: "SAR X.XX/month")
        const priceMatch = service.price.match(/SAR (\d+\.?\d*)/);
        if (priceMatch) {
          newSubtotal += parseFloat(priceMatch[1]);
        }
      });
      
      const newVAT = newSubtotal * 0.15;
      const newTotal = newSubtotal + newVAT;
      
      setServices(updatedServices);
      setPricing({
        subtotal: newSubtotal,
        vat: newVAT,
        totalMonthlySAR: newTotal
      });
    }
  };

  // Handler to clear all services
  const clearAllServices = () => {
    setServices([]);
    setPricing({ subtotal: 0, vat: 0, totalMonthlySAR: 0 });
  };

  // Handler for Request Alternative button
  const handleRequestAlternative = () => {
    // Clear current services and trigger a new AI suggestion
    alert('Please describe your requirements again in the chat for alternative recommendations.');
  };

  // Handler for Manual Adjust button
  const handleManualAdjust = (serviceIndex: number) => {
    // For now, show a simple alert. In the future, this could open a configuration modal
    alert('Manual adjustment feature coming soon! You can currently delete services and request new ones via chat.');
  };

  // Handler for Accept & Finalize button
  const handleAcceptAndFinalize = async () => {
    if (!services || !pricing) return;
    
    try {
      // Transform services data for the Final Quotation Page
      const transformedData = {
        services: services.map(service => ({
          name: service.name,
          type: service.name, // Using name as type for now
          specs: service.description,
          monthlyPrice: parseFloat(service.price.match(/SAR (\d+\.?\d*)/)?.[1] || '0')
        })),
        subtotal: pricing.subtotal || 0,
        vat: pricing.vat || 0,
        total: pricing.totalMonthlySAR || 0
      };

      // Save quotation to backend
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: transformedData.services,
          pricing: {
            subtotal: transformedData.subtotal,
            vat: transformedData.vat,
            total: transformedData.total
          },
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('Quotation saved successfully');
      } else {
        console.warn('Failed to save quotation, but proceeding to final page');
      }
    } catch (error) {
      console.error('Error saving quotation:', error);
      // Continue to final page even if save fails
    }

    // Navigate to Final Quotation Page
    setShowFinalQuotation(true);
    setCurrentView('chat'); // Keep current view as chat so the conditional logic works
  };

  // Handler to go back from Final Quotation Page
  const handleBackToChat = () => {
    setShowFinalQuotation(false);
    setCurrentView('chat');
  };

  // Transform current data for Final Quotation Page
  const getFinalQuotationData = () => {
    if (!services || !pricing) return undefined;
    
    return {
      services: services.map(service => ({
        name: service.name,
        type: service.name,
        specs: service.description,
        monthlyPrice: parseFloat(service.price.match(/SAR (\d+\.?\d*)/)?.[1] || '0')
      })),
      subtotal: pricing.subtotal || 0,
      vat: pricing.vat || 0,
      total: pricing.totalMonthlySAR || 0
    };
  };

  // Render different views based on current state
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingPage 
            onLogin={handleShowLogin}
            onSignup={handleShowSignup}
            onTryAdvisor={handleTryAdvisor}
          />
        );

      case 'login':
        return (
          <LoginPage 
            onLogin={handleLogin}
            onSwitchToSignup={handleShowSignup}
            onBack={handleShowLanding}
          />
        );

      case 'signup':
        return (
          <SignupPage 
            onSignup={handleSignup}
            onSwitchToLogin={handleShowLogin}
            onBack={handleShowLanding}
          />
        );

      case 'dashboard':
        if (!user) {
          setCurrentView('landing');
          return null;
        }
        return (
          <UserDashboard
            user={{
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              plan: 'Free' // You can expand this based on user data
            }}
            onStartNewChat={handleStartNewChat}
            onReopenChat={handleReopenChat}
            onLogout={handleLogout}
            onViewProfile={handleViewProfile}
          />
        );

      case 'chat':
        if (showFinalQuotation) {
          return (
            <FinalQuotationPage 
              configData={getFinalQuotationData()}
              onBack={handleBackToChat}
            />
          );
        }
        return (
          <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar user={user} onLogout={handleLogout} />
            <div className="flex-1 p-4 md:p-8 mt-[3rem] bg-gray-100 overflow-auto">
              <div className="container mx-auto grid grid-cols-1 lg:grid-cols-[40%_58%] gap-8">
                <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
                  <div className="bg-white flex flex-col h-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">AI Consultation Chat</h2>
                        {user && (
                          <button
                            onClick={() => setCurrentView('dashboard')}
                            className="px-3 py-1 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                          >
                            ← Back to Dashboard
                          </button>
                        )}
                      </div>
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
                    onDeleteService={deleteService}
                    onClearAll={clearAllServices}
                    onAcceptAndFinalize={handleAcceptAndFinalize}
                    onRequestAlternative={handleRequestAlternative}
                    onManualAdjust={handleManualAdjust}
                  />
                </div>
              </div>
            </div>
            <footer className="bg-gray-800 text-white py-3 text-center text-xs">
              © 2025 SCCC Alibaba Cloud KSA - AI Pricing & Solution Advisor
            </footer>
          </div>
        );

      case 'finalQuotation':
        return (
          <FinalQuotationPage 
            configData={getFinalQuotationData()}
            onBack={handleBackToChat}
          />
        );

      default:
        return <LandingPage onLogin={handleShowLogin} onSignup={handleShowSignup} onTryAdvisor={handleTryAdvisor} />;
    }
  };

  return renderView();
};

export default App;
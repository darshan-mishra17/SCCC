import React from 'react';
import { Download, ArrowLeft, Check, X, CreditCard } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';

interface ConfigData {
  services: Array<{
    name: string;
    type: string;
    specs: string;
    monthlyPrice: number;
  }>;
  subtotal: number;
  vat: number;
  total: number;
}

interface FinalQuotationPageProps {
  configData?: ConfigData;
  onBack?: () => void;
}

const FinalQuotationPage: React.FC<FinalQuotationPageProps> = ({ 
  configData, 
  onBack 
}) => {
  // Default dummy data matching the screenshot
  const defaultConfig: ConfigData = {
    services: [
      {
        name: "ECS",
        type: "ecs.t6.medium",
        specs: "Instance Type: ecs.t6.medium, Number of Instances: 2, Storage Size: 200 GB, Bandwidth: 10 Mbps, Operating System: Ubuntu 22.04",
        monthlyPrice: 3120.00
      },
      {
        name: "TDSQL",
        type: "MySQL 8.0",
        specs: "Database Engine: MySQL 8.0, Instance Size: small, Storage Size: 200 GB, Backup Retention: 14 days",
        monthlyPrice: 842.00
      }
    ],
    subtotal: 3962.00,
    vat: 594.30,
    total: 4556.30
  };

  const config = configData || defaultConfig;
  const monthlyPrice = config.total;
  const yearlyPrice = monthlyPrice * 12;
  const yearlyDiscount = yearlyPrice * 0.1;
  const yearlyPriceWithDiscount = yearlyPrice - yearlyDiscount;

  const handleDownloadPDF = (planType: 'monthly' | 'yearly') => {
    const price = planType === 'monthly' ? monthlyPrice : yearlyPriceWithDiscount;
    generatePDF(config, planType, price);
  };

  const handleBuyNow = (planType: 'monthly' | 'yearly') => {
    alert(`Redirecting to checkout for ${planType} plan...`);
  };

  const PlanCard: React.FC<{
    title: string;
    price: number;
    originalPrice?: number;
    period: string;
    planType: 'monthly' | 'yearly';
    isPopular?: boolean;
  }> = ({ title, price, originalPrice, period, planType, isPopular }) => (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 relative ${
      isPopular ? 'ring-2 ring-orange-500' : ''
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium">
            Best Value
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-bold text-orange-500">
            SAR {price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-lg text-gray-400 line-through">
              SAR {originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <p className="text-gray-600 mt-2">{period}</p>
        {planType === 'yearly' && (
          <p className="text-green-600 font-medium mt-1">
            Save SAR {yearlyDiscount.toFixed(2)} (10% off)
          </p>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Includes
          </h4>
          <ul className="space-y-2">
            {[
              '24/7 Support',
              'Access to Cloud Dashboard',
              'Basic Monitoring Tools',
              'Email Support',
              'Standard SLA',
              'Monthly Usage Reports'
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-600">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            Excludes
          </h4>
          <ul className="space-y-2">
            {[
              'Custom SLA',
              'Dedicated Account Manager',
              'Priority Phone Support',
              'Advanced Analytics'
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-600">
                <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={() => handleDownloadPDF(planType)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Quotation (PDF)
          </button>
          
          <button
            onClick={() => handleBuyNow(planType)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Chat
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Final Quotation
            </h1>
            <p className="text-gray-600 text-lg">
              Choose your preferred billing plan for your cloud configuration
            </p>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Configuration Summary
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {config.services.map((service, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800">{service.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{service.specs}</p>
                <p className="text-orange-500 font-medium mt-2">
                  SAR {service.monthlyPrice.toFixed(2)}/month
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <PlanCard
            title="Monthly Plan"
            price={monthlyPrice}
            period="per month"
            planType="monthly"
          />
          
          <PlanCard
            title="Yearly Plan"
            price={yearlyPriceWithDiscount}
            originalPrice={yearlyPrice}
            period="per year"
            planType="yearly"
            isPopular
          />
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Important Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Billing</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Monthly plans are billed monthly</li>
                <li>• Yearly plans are billed annually</li>
                <li>• All prices include VAT (15%)</li>
                <li>• Payment due at start of billing period</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Terms</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 30-day money-back guarantee</li>
                <li>• Cancel anytime with 30-day notice</li>
                <li>• SLA terms apply as per agreement</li>
                <li>• Usage limits as specified in plan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalQuotationPage;
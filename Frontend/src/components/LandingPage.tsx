import React from 'react';
import { 
  ArrowRight, 
  MessageSquare, 
  Zap, 
  Calculator, 
  Download,
  Cloud,
  CheckCircle,
  Star,
  Users,
  Shield,
  Clock,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
  onTryAdvisor: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup, onTryAdvisor }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const features = [
    {
      icon: MessageSquare,
      title: "Conversational Service Discovery",
      description: "Chat naturally with our AI to discover the perfect cloud services for your needs. No technical jargon required."
    },
    {
      icon: Zap,
      title: "Smart Field Completion",
      description: "AI automatically suggests optimal configurations based on your requirements, saving hours of research and planning."
    },
    {
      icon: Calculator,
      title: "Real-time Price Estimation",
      description: "Get instant, accurate pricing estimates with VAT calculations and regional pricing for Saudi Arabia."
    },
    {
      icon: Download,
      title: "Export & Finalize Plans",
      description: "Download professional quotations as PDFs or proceed directly to purchase with our streamlined checkout."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Chat with AI",
      description: "Tell our AI advisor about your project requirements in plain language."
    },
    {
      number: "02",
      title: "Configure Services",
      description: "Review AI-suggested configurations and customize them to your exact needs."
    },
    {
      number: "03",
      title: "Download & Buy",
      description: "Get your quotation PDF or proceed directly to purchase your cloud plan."
    }
  ];

  const stats = [
    { number: "10K+", label: "Configurations Generated" },
    { number: "500+", label: "Enterprise Clients" },
    { number: "99.9%", label: "Uptime SLA" },
    { number: "24/7", label: "Expert Support" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SCCC AI Advisor</h1>
                <p className="text-xs text-gray-500">Cloud Pricing & Solutions</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">Home</a>
              <a href="#features" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">How It Works</a>
              <a href="#contact" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">Contact</a>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onLogin}
                className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={onSignup}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <a href="#home" className="text-gray-700 hover:text-orange-500 font-medium">Home</a>
                <a href="#features" className="text-gray-700 hover:text-orange-500 font-medium">Features</a>
                <a href="#how-it-works" className="text-gray-700 hover:text-orange-500 font-medium">How It Works</a>
                <a href="#contact" className="text-gray-700 hover:text-orange-500 font-medium">Contact</a>
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={onLogin}
                    className="text-left text-gray-700 hover:text-orange-500 font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={onSignup}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-center"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-gray-50 to-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                Trusted by 500+ Enterprise Clients
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                AI-Powered Cloud
                <span className="text-orange-500"> Pricing & Solution</span>
                <br />Advisor
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Plan, compare, and estimate cloud infrastructure costs in seconds. 
                Our AI advisor helps you find the perfect cloud configuration for your business needs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onTryAdvisor}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Try the AI Advisor
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={onSignup}
                  className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-500 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200"
                >
                  Start Free Trial
                </button>
              </div>
              
              <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  30-day free trial
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="bg-orange-500 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 text-white">
                    <MessageSquare className="h-6 w-6" />
                    <span className="font-semibold">AI Consultation Chat</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-600">What type of application are you planning to deploy?</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 ml-8">
                    <p className="text-sm text-gray-700">A web application with database for 1000 users</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Perfect! I recommend ECS instances with TDSQL database...</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">Estimated Cost:</span>
                    <span className="text-lg font-bold text-green-700">SAR 4,556.30/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-orange-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-orange-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Smart Cloud Planning
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform simplifies cloud infrastructure planning with intelligent recommendations and accurate cost estimates.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get from idea to implementation in three simple steps with our AI-guided process.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-full text-xl font-bold mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <ArrowRight className="h-6 w-6 text-orange-300 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshot Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the intuitive interface that makes cloud planning effortless.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-gray-100 rounded-xl p-6 h-80 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">AI Consultation Interface</p>
                  <p className="text-sm text-gray-400 mt-2">Interactive chat with intelligent recommendations</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-xl p-6 h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Cost Summary Dashboard</p>
                  <p className="text-sm text-gray-400 mt-2">Detailed pricing breakdown and quotations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Start Your Free AI Consultation Today!
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who trust SCCC AI Advisor for their cloud infrastructure planning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onLogin}
              className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Login to Dashboard
            </button>
            <button
              onClick={onSignup}
              className="bg-orange-700 hover:bg-orange-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Sign Up Free
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-orange-100">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Enterprise Security
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              24/7 Support
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              500+ Happy Clients
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">SCCC AI Advisor</h3>
                  <p className="text-gray-400 text-sm">Cloud Pricing & Solutions</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering businesses with AI-driven cloud infrastructure planning and cost optimization solutions.
              </p>
              <div className="text-gray-400">
                <p>📧 support@sccc-ai.com</p>
                <p>📞 +966 11 123 4567</p>
                <p>📍 Riyadh, Saudi Arabia</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SCCC Alibaba Cloud KSA - AI Pricing & Solution Advisor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
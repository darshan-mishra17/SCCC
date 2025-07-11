import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ChatPanel from './components/ChatPanel';
import SuggestionPanel from './components/SuggestionPanel';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

interface Service {
  name: string;
  description: string;
  price: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      text: "Hello! I'm your SCCC AI Solution Advisor. Please describe your customer's needs or the problem they are trying to solve."
    },
    {
      type: 'user',
      text: "I need help setting up an e-commerce backend for a client."
    },
    {
      type: 'bot',
      text: "Understood. To clarify for the e-commerce backend:\n1. What is the estimated number of SKUs in their product catalog?\n2. What is the anticipated peak order volume per hour?\n3. Are there specific database preferences (e.g., MySQL, PostgreSQL)?\n4. Do they require PCI-DSS compliance for payments?"
    },
    {
      type: 'user',
      text: "About 500 SKUs, expecting 100 orders/hour peak, MySQL preferred, and yes for PCI compliance."
    },
    {
      type: 'bot',
      text: "Thank you. Based on this, I recommend the following initial SCCC services. I'll add them to the estimate panel for your review."
    }
  ]);

  const [inputValue, setInputValue] = useState<string>('');

  const services: Service[] = [
    {
      name: "Elastic Compute Service (ECS)",
      description: "ecs.g6.large, Linux, 40GB System, 100GB Data",
      price: "SAR 150.00/month"
    },
    {
      name: "Relational Database Service (RDS)",
      description: "MySQL, rds.mysql.s2.medium, 50GB Storage",
      price: "SAR 120.00/month"
    },
    {
      name: "Server Load Balancer (SLB)",
      description: "Application LB, 10 LCUs",
      price: "SAR 75.00/month"
    },
    {
      name: "Web Application Firewall (WAF)",
      description: "Pro Edition, 1 Domain",
      price: "SAR 150.00/month"
    }
  ];

  const handleSendMessage = (text: string) => {
    setMessages(prev => [...prev, { type: 'user', text }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: "Thank you for the information. I'm analyzing your requirements and will update the solution recommendations accordingly." 
      }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 md:p-8 mt-[3rem] bg-gray-100 overflow-auto">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-[40%_58%] gap-8">
          <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
            <ChatPanel 
              messages={messages}
              onSendMessage={handleSendMessage}
              inputValue={inputValue}
              setInputValue={setInputValue}
            />
          </div>
          <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
            <SuggestionPanel 
              services={services}
              subtotal="SAR 530.00"
              vat="SAR 79.50"
              total="SAR 609.50"
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
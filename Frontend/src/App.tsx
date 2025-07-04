import React, { useState } from 'react';
import ChatPanel from './ChatPanel';
import SolutionPanel from './SolutionPanel';
import type { Message, ServiceSuggestion, CostSummary } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      content: "Hello! I'm your SCCC AI Solution Advisor. Please describe your customer's needs or the problem they are trying to solve.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<ServiceSuggestion[]>([]);
  const [costSummary, setCostSummary] = useState<CostSummary>({ subtotal: 0, vat: 0, total: 0 });

  // Send user message to backend and handle AI response
  const handleSend = async (userText: string) => {
    const userMsg: Message = {
      type: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userText }),
      });
      if (!res.ok) throw new Error('Server responded with ' + res.status);
      const data = await res.json();
      // Add AI message to chat
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: 'Here is the suggested solution and estimate. You can request alternatives or adjust as needed.',
          timestamp: new Date().toISOString(),
        },
      ]);
      setSolution(data.solution || []);
      // Calculate costs
      const subtotal = data.solution.reduce((acc: number, s: ServiceSuggestion) => acc + (s.defaultEstimatedMonthlyCost || 0), 0);
      const vat = subtotal * 0.15;
      setCostSummary({ subtotal, vat, total: subtotal + vat });
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: 'AI API error: ' + err.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
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
          <ChatPanel messages={messages} onSend={handleSend} loading={loading} />
          <SolutionPanel solution={solution} costSummary={costSummary} />
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

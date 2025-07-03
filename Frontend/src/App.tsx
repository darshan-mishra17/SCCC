import React, { useRef, useEffect } from 'react';
import { sendUserPrompt } from './api';

type Message = { role: 'user' | 'ai'; content: string };

function App() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'ai',
      content: "Hello! I'm your SCCC AI Solution Advisor. Please describe your customer's needs or the problem they are trying to solve.",
    },
  ]);
  const [input, setInput] = React.useState('');
  const [suggestedSolution, setSuggestedSolution] = React.useState<any[]>([]);
  const [pricing, setPricing] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);
    try {
      // 1. Get AI config and solution from backend
      const aiResponse = await sendUserPrompt('recommendation', input);
      // aiResponse should contain: { message: string, solution: Array<{name, config, monthlyCost}>, ... }
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: aiResponse.message || 'Here is the recommended configuration:' },
      ]);
      setSuggestedSolution(Array.isArray(aiResponse.solution) ? aiResponse.solution : []);
      // 2. Get pricing from backend
      // Calculate subtotal, vat, and total directly from the solution array's monthlyCost
      const validServices = Array.isArray(aiResponse.solution) ? aiResponse.solution.filter((s: { monthlyCost: number }) => typeof s.monthlyCost === 'number') : [];
      const subtotal = validServices.reduce((sum: number, s: { monthlyCost: number }) => sum + s.monthlyCost, 0);
      const vat = subtotal * 0.15;
      const totalMonthlySAR = subtotal + vat;
      setPricing({ subtotal, vat, totalMonthlySAR });
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Error: Unable to get AI recommendation or pricing.' },
      ]);
    }
    setLoading(false);
  };

  const handleAccept = () => {
    alert('Suggestion accepted (Prototype action). Final estimate ready for export.');
  };
  const handleRequestAlt = () => {
    setMessages((prev) => [
      ...prev,
      { role: 'ai', content: 'What kind of alternative are you looking for?' },
    ]);
  };
  const handleManualAdjust = () => {
    alert('Manual adjustment interface would open here (Prototype action).');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] font-sans text-[#333]">
      {/* Header */}
      <header className="bg-white shadow-sm py-3 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">SCCC AI Advisor</h1>
          </div>
          <span className="text-sm text-gray-500">Sales Agent: Hiba</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 h-full">
          {/* Chat Panel */}
          <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#E0E0E0]">
              <h2 className="text-lg font-semibold text-gray-700">AI Consultation Chat</h2>
            </div>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto" style={{ height: 'calc(100vh - 280px)', minHeight: '300px' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[80%] line-height-1.5 ${
                    msg.role === 'user' 
                      ? 'ml-auto bg-[#E0E0E0] rounded-br-sm' 
                      : 'bg-[#0070E0] text-white rounded-bl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              ))}
              {loading && (
                <div className="p-3 rounded-xl max-w-[80%] bg-[#0070E0] text-white italic text-gray-300 rounded-bl-sm">
                  AI is typing...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-[#E0E0E0] bg-gray-50">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  className="flex-grow resize-none p-2.5 border border-[#D1D5DB] rounded-md text-sm focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-300 outline-none"
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
                  placeholder="Type your customer's requirements..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  className="self-end bg-[#FF6A00] text-white px-5 py-2.5 rounded-md font-semibold hover:bg-[#E65C00] transition-colors"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Solution Panel */}
          <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)', minHeight: '400px' }}>
            <div className="p-4 border-b border-[#E0E0E0]">
              <h2 className="text-lg font-semibold text-gray-700">AI Suggested Solution & Estimate</h2>
            </div>
            <div className="flex-grow p-4 space-y-3 overflow-y-auto">
              {(!suggestedSolution || suggestedSolution.length === 0) ? (
                <p className="text-gray-500 text-sm">The AI will suggest services and configurations here based on your conversation.</p>
              ) : (
                suggestedSolution.map((service, idx) => (
                  <div key={idx} className="bg-white border border-[#E0E0E0] rounded-lg p-4 mb-3">
                    <h4 className="font-semibold text-gray-700">{service.name}</h4>
                    <p className="text-xs text-gray-500 mb-1">{service.config}</p>
                    <p className="text-sm font-semibold text-[#FF6A00]">Est. SAR {service.monthlyCost ? service.monthlyCost.toFixed(2) : '--'}/month</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-[#E0E0E0] bg-gray-50">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Subtotal:</span>
                  <span className="font-semibold">SAR {pricing?.subtotal?.toFixed(2) ?? '--'}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>VAT (15%):</span>
                  <span className="font-semibold">SAR {pricing?.vat?.toFixed(2) ?? '--'}</span>
                </div>
                <hr className="my-2 border-gray-200" />
                <div className="flex justify-between text-lg font-bold text-[#FF6A00]">
                  <span>Total Estimated Monthly Cost:</span>
                  <span>SAR {pricing?.totalMonthlySAR?.toFixed(2) ?? '--'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  className="bg-[#FF6A00] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#E65C00] transition-colors"
                  onClick={handleAccept}
                >
                  Accept & Finalize Estimate
                </button>
                <button
                  className="bg-[#F3F4F6] text-[#374151] px-4 py-2 border border-[#D1D5DB] rounded-md text-sm font-medium hover:bg-[#E5E7EB] transition-colors"
                  onClick={handleRequestAlt}
                >
                  Request Alternative
                </button>
                <button
                  className="bg-[#F3F4F6] text-[#374151] px-4 py-2 border border-[#D1D5DB] rounded-md text-sm font-medium hover:bg-[#E5E7EB] transition-colors"
                  onClick={handleManualAdjust}
                >
                  Manually Adjust
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-3 mt-auto">
        <p className="text-xs">&copy; 2025 SCCC Alibaba Cloud KSA - AI Pricing & Solution Advisor</p>
      </footer>
    </div>
  );
}

export default App;
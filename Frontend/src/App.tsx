
import React, { useRef, useEffect } from 'react';
import { sendUserPrompt, calculatePricing } from './api';

type Message = { role: 'user' | 'ai'; content: string };

function App() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'ai',
      content:
        "Hello! I'm your SCCC AI Solution Advisor. Please describe your customer's needs or the problem they are trying to solve.",
    },
  ]);
  const [input, setInput] = React.useState('');
  const [suggestedSolution, setSuggestedSolution] = React.useState<any>(null);
  const [pricing, setPricing] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Chat send handler
  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);
    try {
      // 1. Get AI config from backend
      const aiConfig = await sendUserPrompt('recommendation', input);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Here is the recommended configuration:' },
      ]);
      setSuggestedSolution(aiConfig);
      // 2. Get pricing from backend
      const price = await calculatePricing(aiConfig);
      setPricing(price);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Error: Unable to get AI recommendation or pricing.' },
      ]);
    }
    setLoading(false);
  };

  // Button actions
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
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] font-['Inter',sans-serif] text-[#333]">
      {/* Header */}
      <header className="bg-white shadow-sm py-3 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <img src="https://placehold.co/150x35/FF6A00/FFFFFF?text=SCCC+AI+Advisor&font=Inter" alt="SCCC AI Advisor Logo" className="h-8 w-auto mr-3" />
          </div>
          <span className="text-sm text-gray-500">Sales Agent: Hiba</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-2 sm:px-4 lg:px-8 py-4">
        <div className="flex flex-row gap-4 h-full w-full" style={{minHeight: '500px'}}>
          {/* Chat Panel */}
          <div className="flex-1 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden min-w-[320px] max-w-[540px]" style={{flexBasis: '38%'}}>
            <div className="p-4 border-b border-[#E0E0E0]">
              <h2 className="text-lg font-semibold text-gray-700">AI Consultation Chat</h2>
            </div>
            <div className="scrollable-chat flex-grow p-4 space-y-4 overflow-y-auto" style={{height: 'calc(100vh - 280px)', minHeight: '300px'}}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-bubble text-base ${msg.role === 'user' ? 'ml-auto' : ''}`}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#E0E0E0' : '#0070E0',
                    color: msg.role === 'user' ? '#333' : '#fff',
                    borderRadius: '1rem',
                    borderBottomRightRadius: msg.role === 'user' ? '0.25rem' : '1rem',
                    borderBottomLeftRadius: msg.role === 'ai' ? '0.25rem' : '1rem',
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    lineHeight: 1.5,
                  }}
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              ))}
              {loading && (
                <div className="chat-bubble italic text-gray-300" style={{backgroundColor:'#0070E0',color:'#fff',borderRadius:'1rem',borderBottomLeftRadius:'0.25rem',maxWidth:'80%',padding:'0.75rem 1rem',lineHeight:1.5}}>AI is typing...</div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form
              className="flex gap-2 border-t border-[#E0E0E0] p-4 bg-gray-50"
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
            >
              <textarea
                rows={2}
                className="form-textarea flex-grow resize-none rounded-md border border-orange-500 p-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-300 outline-none"
                style={{boxShadow: input ? '0 0 0 2px rgba(255,106,0,0.3)' : undefined}}
                placeholder="Type your customer's requirements..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-primary self-end bg-[#FF6A00] hover:bg-[#E65C00] text-white font-semibold px-5 py-2.5 rounded-md text-base transition"
                disabled={loading || !input.trim()}
                style={{minWidth:'90px'}}
              >
                Send
              </button>
            </form>
          </div>

          {/* Solution Panel */}
          <div className="flex-1 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden solution-panel-height min-h-[400px]" style={{height: 'calc(100vh - 120px)', minWidth: '400px', flexBasis: '62%'}}>
            <div className="p-4 border-b border-[#E0E0E0]">
              <h2 className="text-lg font-semibold text-gray-700">AI Suggested Solution & Estimate</h2>
            </div>
            <div className="flex-grow p-4 space-y-3 overflow-y-auto">
              {!suggestedSolution ? (
                <p className="text-gray-500 text-sm">The AI will suggest services and configurations here based on your conversation.</p>
              ) : (
                <pre className="bg-gray-100 rounded p-4 text-xs overflow-x-auto">{JSON.stringify(suggestedSolution, null, 2)}</pre>
              )}
            </div>
            <div className="p-4 border-t border-[#E0E0E0] bg-gray-50">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Subtotal:</span>
                  <span className="font-semibold">SAR {pricing?.subtotal?.toFixed(2) ?? '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>VAT (15%):</span>
                  <span className="font-semibold">SAR {pricing?.vat?.toFixed(2) ?? '0.00'}</span>
                </div>
                <hr className="my-2 border-gray-200" />
                <div className="flex justify-between text-lg font-bold text-[#FF6A00]">
                  <span>Total Estimated Monthly Cost:</span>
                  <span>SAR {pricing?.totalMonthlySAR?.toFixed(2) ?? '0.00'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  className="btn-primary text-sm bg-[#FF6A00] hover:bg-[#E65C00] text-white font-semibold px-5 py-2.5 rounded-md transition"
                  onClick={handleAccept}
                  type="button"
                >
                  Accept & Finalize Estimate
                </button>
                <button
                  className="btn-secondary text-sm bg-[#F3F4F6] border border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-md transition hover:bg-[#E5E7EB]"
                  onClick={handleRequestAlt}
                  type="button"
                >
                  Request Alternative
                </button>
                <button
                  className="btn-secondary text-sm bg-[#F3F4F6] border border-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-md transition hover:bg-[#E5E7EB]"
                  onClick={handleManualAdjust}
                  type="button"
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

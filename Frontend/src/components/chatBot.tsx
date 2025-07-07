import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: Date;
}

const ChatBot = () => {
  const [sessionId] = useState(() => uuidv4());
  const [chat, setChat] = useState<ChatMessage[]>([
    { 
      sender: 'ai', 
      text: 'Hello! I am your AI Pricing Advisor. Which service would you like to configure? (ECS, OSS, TDSQL)',
      timestamp: new Date()
    }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || loading) return;
    
    const userMsg = userMessage.trim();
    const userMessageObj: ChatMessage = {
      sender: 'user',
      text: userMsg,
      timestamp: new Date()
    };

    // Update UI immediately with user message
    setChat(prev => [...prev, userMessageObj]);
    setUserMessage('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:4000/api/ai/message', { 
        sessionId, 
        userMessage: userMsg 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.data?.message) {
        const aiMessageObj: ChatMessage = {
          sender: 'ai',
          text: res.data.message,
          timestamp: new Date()
        };
        setChat(prev => [...prev, aiMessageObj]);
      }
      // Show pricing summary if present
      if (res.data?.pricing && res.data?.config) {
        setSummary({ config: res.data.config, pricing: res.data.pricing });
      }
    } catch (err) {
      console.error('API Error:', err);
      const errorMessageObj: ChatMessage = {
        sender: 'ai',
        text: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setChat(prev => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  // Pricing summary state
  const [summary, setSummary] = useState<{ config: any, pricing: any } | null>(null);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow p-4">
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {chat.map((msg, idx) => (
          <div key={`${msg.timestamp?.getTime() || idx}`} 
               className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg text-sm whitespace-pre-line ${
              msg.sender === 'user' 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-gray-200 text-gray-900 rounded-bl-none'
            }`}>
              {msg.text}
              <div className="text-xs opacity-70 mt-1">
                {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
        {/* Pricing summary card */}
        {summary && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="font-semibold mb-2 text-green-800">Pricing Summary</div>
            <div className="mb-2">
              <span className="font-medium">Configuration:</span>
              <pre className="bg-gray-100 rounded p-2 text-xs mt-1 overflow-x-auto">{JSON.stringify(summary.config, null, 2)}</pre>
            </div>
            <div className="mb-1"><span className="font-medium">Subtotal:</span> {summary.pricing.subtotalSAR} SAR</div>
            <div className="mb-1"><span className="font-medium">VAT (15%):</span> {summary.pricing.vatSAR} SAR</div>
            <div className="mb-1"><span className="font-medium">Total Monthly:</span> <span className="text-green-700 font-bold">{summary.pricing.totalMonthlySAR} SAR</span></div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 mt-2">
        <textarea
          className="flex-1 resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300 min-h-[40px] max-h-[120px]"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          disabled={loading || !userMessage.trim()}
        >
          {loading ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
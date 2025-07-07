import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';

interface ChatMessageType {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: Date;
}

interface ChatBotProps {
  onFinalConfig?: (config: any, pricing: any) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onFinalConfig }) => {
  const [sessionId] = useState(() => uuidv4());
  const [chat, setChat] = useState<ChatMessageType[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Pricing Advisor. Which service would you like to configure? (ECS, OSS, TDSQL)',
      timestamp: new Date(),
    },
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  // No summary state needed; summary is handled in parent
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = async (e: React.FormEvent) => {
    console.log('handleSend called');
    e.preventDefault();
    if (!userMessage.trim() || loading) return;

    const userMsg = userMessage.trim();
    const userMessageObj: ChatMessageType = {
      sender: 'user',
      text: userMsg,
      timestamp: new Date(),
    };

    setChat((prev) => [...prev, userMessageObj]);
    setUserMessage('');
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:4000/api/ai/message',
        {
          sessionId,
          userMessage: userMsg,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      // DEBUG: Log backend response
      console.log('[DEBUG] Backend response:', res.data);

      // Only add to chat if not a final configuration/summary
      if (res.data?.services && res.data?.pricing) {
        if (onFinalConfig) {
          onFinalConfig(res.data.services, res.data.pricing);
        }
        // Do NOT add summary message to chat
      } else if (res.data?.message) {
        const aiMessageObj: ChatMessageType = {
          sender: 'ai',
          text: res.data.message,
          timestamp: new Date(),
        };
        setChat((prev) => [...prev, aiMessageObj]);
      }
    } catch (err) {
      console.error('API Error:', err);
      const errorMessageObj: ChatMessageType = {
        sender: 'ai',
        text: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setChat((prev) => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow p-4 max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto mb-2 space-y-2 pb-2">
        {chat.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.sender} content={msg.text} />
        ))}
        <div ref={chatEndRef} />
        {/* No summary here; summary is shown in the right panel only */}
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
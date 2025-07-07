import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';

// Utility to ensure message is a string
const ensureString = (message: unknown): string => {
  if (typeof message === 'string') return message;
  if (typeof message === 'number') return String(message);
  if (message && typeof message === 'object') {
    try {
      if ('message' in message) return String(message.message);
      if ('response' in message) return String(message.response);
      if ('question' in message) return String(message.question);
      return JSON.stringify(message);
    } catch (e) {
      console.error('Failed to stringify message:', message);
      return '[Complex message]';
    }
  }
  return String(message);
};

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
  const [chat, setChat] = useState<ChatMessageType[]>(
    [
      {
        sender: 'ai',
        text: 'Hello! I am your AI Pricing Advisor. Which service would you like to configure? (ECS, OSS, TDSQL)',
        timestamp: new Date(),
      },
    ]
  );
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
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

    // Show "AI is thinking..." message
    setChat((prev) => [...prev, { sender: 'ai', text: '...', timestamp: new Date() }]);

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

      // Remove the last "..." message
      setChat((prev) => prev.slice(0, -1));

      // Always ensure message is a string
      if (res.data?.message !== undefined) {
        const safeMessage = ensureString(res.data.message);
        setTimeout(() => {
          setChat((prev) => [...prev, {
            sender: 'ai',
            text: safeMessage,
            timestamp: new Date(),
          }]);
        }, 400);
      }

      // Only call onFinalConfig if services/pricing present
      if (res.data?.services && res.data?.pricing && onFinalConfig) {
        onFinalConfig(res.data.services, res.data.pricing);
      }
    } catch (err) {
      setChat((prev) => prev.slice(0, -1));
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
        {chat.map((msg, idx) => {
          // Extra safety: log and stringify if needed
          let safeText = msg.text;
          // Catch-all: always render a string or number, never an object/array
          if (typeof safeText !== 'string' && typeof safeText !== 'number') {
            console.error('Non-string/number message detected in chat:', safeText);
            try {
              safeText = JSON.stringify(safeText);
            } catch (e) {
              safeText = '[Unrenderable message]';
            }
          }
          return <ChatMessage key={idx} role={msg.sender} content={safeText} />;
        })}
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
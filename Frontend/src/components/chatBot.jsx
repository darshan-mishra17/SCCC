import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const ChatBot = ({ onFinalConfig }) => {
  const [sessionId] = useState(() => uuidv4());
  const [chat, setChat] = useState([
    { 
      sender: 'ai', 
      text: 'Hi! I\'m your AI-powered pricing advisor. Describe your application requirements and I\'ll suggest the perfect cloud solution with accurate pricing. For example: "I need a mobile app backend for 5000 users" or "E-commerce website with payment processing"',
      timestamp: new Date()
    }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userMessage.trim() || loading) return;
    
    const userMsg = userMessage.trim();
    const userMessageObj = {
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

      if (res.data?.message !== undefined) {
        // Debug: log what we're receiving
        console.log('Received response from backend:', res.data);
        
        // Check if AI suggestion is complete
        if (res.data.complete && res.data.services && res.data.pricing) {
          console.log('[DEBUG] AI suggestion complete, calling onFinalConfig');
          console.log('[DEBUG] Services:', res.data.services);
          console.log('[DEBUG] Pricing:', res.data.pricing);
          
          if (onFinalConfig) {
            onFinalConfig(res.data.services, res.data.pricing);
          }
        }
        
        // Handle the AI response message
        let messageText;
        try {
          if (typeof res.data.message === 'string') {
            messageText = res.data.message;
          } else if (typeof res.data.message === 'object' && res.data.message !== null) {
            // Try multiple properties that might contain the actual message
            if (res.data.message.message) {
              messageText = String(res.data.message.message);
            } else if (res.data.message.question) {
              messageText = String(res.data.message.question);
            } else if (res.data.message.response) {
              messageText = String(res.data.message.response);
            } else if (res.data.message.text) {
              messageText = String(res.data.message.text);
            } else if (res.data.message.content) {
              messageText = String(res.data.message.content);
            } else {
              // Last resort: stringify the entire object
              messageText = JSON.stringify(res.data.message);
            }
          } else {
            messageText = String(res.data.message);
          }
        } catch (error) {
          console.error('Error converting message to string:', error);
          messageText = 'Error displaying message';
        }
        
        console.log('Final messageText:', messageText);
        
        const aiMessageObj = {
          sender: 'ai',
          text: messageText,
          timestamp: new Date()
        };
        setChat(prev => [...prev, aiMessageObj]);
      }
    } catch (err) {
      console.error('API Error:', err);
      let errorMessage = 'Sorry, there was an error processing your request. Please try again.';
      
      // Provide more specific error messages
      if (err.response?.status === 500) {
        errorMessage = 'The AI service is temporarily unavailable. Please try again in a moment.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (err.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Network connection issue. Please check your internet connection.';
      }
      
      const errorMessageObj = {
        sender: 'ai',
        text: errorMessage,
        timestamp: new Date()
      };
      setChat(prev => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '60vh' }}>
        {chat.map((msg, idx) => (
          <div key={`${msg.timestamp?.getTime() || idx}`} 
               className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start max-w-xs md:max-w-md lg:max-w-md gap-2`}>
              {/* Icon */}
              <div className={`flex-shrink-0 w-4 h-4 mt-0.5 ${
                msg.sender === 'user' 
                  ? 'text-gray-600' 
                  : 'text-blue-600'
              }`}>
                {msg.sender === 'user' ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              
              {/* Message Bubble */}
              <div className={`px-4 py-2 rounded-lg ${
                msg.sender === 'user' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-blue-100 text-gray-800'
              }`}>
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-xs md:max-w-md lg:max-w-md">
              <div className="flex-shrink-0 w-4 h-4 mt-0.5 text-blue-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Describe your application requirements (e.g., 'I need a mobile app backend with 1000 users')..."
            className="flex-1 h-[4rem] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            className="h-[2.5rem] bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            disabled={loading || !userMessage.trim()}
          >
            {loading ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">Sending...</span>
              </span>
            ) : (
              <>
                <span className="hidden sm:inline">Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;

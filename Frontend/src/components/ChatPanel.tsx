import React from 'react';
import { Send, User, Bot } from 'lucide-react';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, 
  onSendMessage, 
  inputValue, 
  setInputValue,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="bg-white flex flex-col h-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">AI Consultation Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '60vh' }}>
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user' 
                ? 'bg-gray-100 text-gray-800' 
                : 'bg-blue-100 text-gray-800'
            }`}>
              <div className="flex items-start gap-2">
                {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />}
                <div className="text-sm whitespace-pre-line">{message.text}</div>
                {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your customer's requirements..."
            className="flex-1 h-[4rem] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            className="h-[2.5rem] bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm"
          >
            <span className="hidden sm:inline">Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
import React, { useRef, useEffect } from 'react';
import type { Message } from './types';

interface ChatPanelProps {
  messages: Message[];
  onSend: (text: string) => void;
  loading: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSend, loading }) => {
  const [input, setInput] = React.useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim() === '' || loading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#E0E0E0]">
        <h2 className="text-lg font-semibold text-gray-700">AI Consultation Chat</h2>
      </div>
      <div ref={chatRef} className="scrollable-chat flex-grow p-4 space-y-4 overflow-y-auto" style={{ minHeight: 300, height: 'calc(100vh - 280px)' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${msg.type === 'user' ? 'chat-bubble-user ml-auto bg-[#E0E0E0] text-gray-900 rounded-xl rounded-br-sm' : 'chat-bubble-ai bg-[#0070E0] text-white rounded-xl rounded-bl-sm'}`}
            style={{ maxWidth: '80%', padding: '0.75rem 1rem', borderRadius: '1rem', lineHeight: 1.5 }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble chat-bubble-ai italic text-gray-300">AI is typing...</div>
        )}
      </div>
      <div className="p-4 border-t border-[#E0E0E0] bg-gray-50">
        <div className="flex gap-2">
          <textarea
            rows={2}
            className="form-textarea flex-grow resize-none border border-gray-300 rounded-md text-sm p-2.5 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-200"
            placeholder="Type your customer's requirements..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
          />
          <button
            className="btn-primary self-end bg-[#FF6A00] text-white px-5 py-2 rounded-md font-semibold hover:bg-[#E65C00]"
            onClick={handleSend}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

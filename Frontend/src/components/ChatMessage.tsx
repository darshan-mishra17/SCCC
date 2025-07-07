import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
}


const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-5 py-3 rounded-2xl text-base whitespace-pre-line break-words transition-all shadow
          ${isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white text-blue-900 border border-gray-200 rounded-bl-none'}
        `}
      >
        {content}
      </div>
    </div>
  );
};

export default ChatMessage;

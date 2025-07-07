import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: unknown;  // Accept any type but convert to string
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === 'user';
  
  // Guarantee string content
  const safeContent = React.useMemo(() => {
    if (typeof content === 'string') return content;
    if (typeof content === 'number') return String(content);
    if (content && typeof content === 'object') {
      try {
        if ('message' in content) return String(content.message);
        return JSON.stringify(content);
      } catch (e) {
        return '[Complex message]';
      }
    }
    return String(content);
  }, [content]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-5 py-3 rounded-2xl text-base whitespace-pre-line break-words transition-all shadow
          ${isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white text-blue-900 border border-gray-200 rounded-bl-none'}
        `}
      >
        {safeContent}
      </div>
    </div>
  );
};

export default ChatMessage;

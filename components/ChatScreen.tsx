import React, { useEffect, useRef, useState } from 'react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { SendIcon, XMarkIcon } from './Icons';

interface Props {
  onClose: () => void;
}

const ChatScreen: React.FC<Props> = ({ onClose }) => {
  const { messages, isLoading, sendMessage, initChat } = useGeminiChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 relative">
      {/* Header */}
      <div className="bg-slate-800 p-4 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 relative">
             <img src="https://picsum.photos/200/200" alt="Agent" className="w-full h-full object-cover" />
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-slate-800"></div>
          </div>
          <div>
            <h3 className="font-bold text-white">WOW-Agent</h3>
            <p className="text-xs text-blue-400">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-100 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-2xl p-4 rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-slate-900 text-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputText.trim()}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
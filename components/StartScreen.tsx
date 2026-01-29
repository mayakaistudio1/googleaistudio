import React from 'react';
import { PhoneIcon, VideoIcon, ChatBubbleIcon } from './Icons';
import { CallMode } from '../types';

interface Props {
  onStart: (mode: CallMode) => void;
  isLoading: boolean;
}

const StartScreen: React.FC<Props> = ({ onStart, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 text-center">
      <div className="mb-8 relative">
        <div className="w-32 h-32 rounded-full bg-blue-500/20 animate-pulse absolute top-0 left-0"></div>
        <img 
          src="https://picsum.photos/200/200" 
          alt="WOW Agent" 
          className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-2xl relative z-10"
        />
        <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-slate-900 z-20"></div>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        WOW-Agent
      </h1>
      <p className="text-slate-400 mb-8 max-w-xs">
        Ваш персональный интерактивный помощник. Выберите формат общения:
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onStart(CallMode.AUDIO)}
          disabled={isLoading}
          className="flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 p-4 rounded-xl transition-all border border-slate-600 hover:border-blue-500 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
              <PhoneIcon className="w-5 h-5" />
            </div>
            <span className="font-semibold">Аудио звонок</span>
          </div>
        </button>

        <button
          onClick={() => onStart(CallMode.VIDEO)}
          disabled={isLoading}
          className="flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 p-4 rounded-xl transition-all border border-slate-600 hover:border-purple-500 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
              <VideoIcon className="w-5 h-5" />
            </div>
            <span className="font-semibold">Видео звонок</span>
          </div>
        </button>

        <button
          onClick={() => onStart(CallMode.CHAT)}
          disabled={isLoading}
          className="flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 p-4 rounded-xl transition-all border border-slate-600 hover:border-green-500 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
              <ChatBubbleIcon className="w-5 h-5" />
            </div>
            <span className="font-semibold">Текстовый чат</span>
          </div>
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        Демонстрация технологии Gemini Live & Chat
      </p>
    </div>
  );
};

export default StartScreen;
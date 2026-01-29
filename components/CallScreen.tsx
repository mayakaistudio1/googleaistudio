import React, { useEffect, useState, useRef } from 'react';
import { AppState, CallMode } from '../types';
import { PhoneOffIcon, MicIcon, MicOffIcon } from './Icons';

interface Props {
  state: AppState;
  volume: number;
  mode: CallMode;
  videoStream: MediaStream | null;
  onEnd: () => void;
}

const CallScreen: React.FC<Props> = ({ state, volume, mode, videoStream, onEnd }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const userVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (state === AppState.ACTIVE) {
      const timer = setInterval(() => setDuration(d => d + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [state]);

  useEffect(() => {
    if (videoStream && userVideoRef.current) {
        userVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const avatarScale = 1 + (volume * 0.4);
  const ringOpacity = volume * 0.8;

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 z-0 pointer-events-none"></div>

      {/* User Video (PiP or Background) - Only in Video Mode */}
      {mode === CallMode.VIDEO && (
          <div className="absolute top-0 left-0 w-full h-full z-0 opacity-30">
             {/* Abstract background fallback if stream fails, but normally stream is here */}
          </div>
      )}

      {/* Top Info */}
      <div className="relative z-10 flex flex-col items-center pt-8">
        <h2 className="text-xl font-semibold tracking-wide">WOW-Agent</h2>
        <p className="text-blue-400 text-sm mt-1">
          {state === AppState.CONNECTING ? 'Connecting...' : formatTime(duration)}
        </p>
      </div>

      {/* Main Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8">
        
        {/* Agent Avatar */}
        <div className="relative">
            <div 
                className="absolute inset-0 rounded-full border-4 border-blue-500 transition-all duration-75 ease-out"
                style={{ transform: `scale(${1 + volume})`, opacity: ringOpacity }}
            ></div>
             <div 
                className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl transition-all duration-75 ease-out"
                style={{ transform: `scale(${1 + volume * 1.5})`, opacity: ringOpacity }}
            ></div>
            <img 
                src="https://picsum.photos/200/200" 
                alt="Agent" 
                className="w-40 h-40 rounded-full object-cover border-4 border-slate-800 shadow-2xl relative z-20 transition-transform duration-100 ease-out"
                style={{ transform: `scale(${avatarScale})` }}
            />
        </div>

        {/* User Video Preview (If Video Mode) */}
        {mode === CallMode.VIDEO && (
            <div className="relative w-32 h-48 bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg mt-4">
                <video 
                    ref={userVideoRef}
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
                />
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
        )}

      </div>

      <div className="relative z-10 text-center pb-8 h-12">
         {state === AppState.ACTIVE && volume > 0.1 && (
             <span className="text-blue-300 text-sm font-medium animate-pulse">
                 Agent is listening...
             </span>
         )}
      </div>

      {/* Controls */}
      <div className="relative z-10 bg-slate-800/80 backdrop-blur-md rounded-t-3xl p-8 pb-12 flex items-center justify-center gap-8">
        <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
        >
            {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
        </button>

        <button 
            onClick={onEnd}
            className="p-5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg shadow-red-500/30 transform active:scale-95 transition-all"
        >
            <PhoneOffIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default CallScreen;
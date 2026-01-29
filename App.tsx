import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import CallScreen from './components/CallScreen';
import ChatScreen from './components/ChatScreen';
import { useGeminiLive } from './hooks/useGeminiLive';
import { AppState, CallMode } from './types';

const App: React.FC = () => {
  const { state, volume, connect, disconnect, errorMsg, videoStream } = useGeminiLive();
  const [currentMode, setCurrentMode] = useState<CallMode | null>(null);

  const handleStart = async (mode: CallMode) => {
    setCurrentMode(mode);
    if (mode === CallMode.CHAT) {
      // Chat mode handles its own state
    } else {
      await connect(mode === CallMode.VIDEO);
    }
  };

  const handleEnd = () => {
    if (currentMode === CallMode.CHAT) {
        setCurrentMode(null);
    } else {
        disconnect();
        setCurrentMode(null);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-900 font-sans">
      {/* Error Toast */}
      {errorMsg && currentMode !== CallMode.CHAT && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg z-50 text-sm shadow-lg backdrop-blur-sm">
          {errorMsg}
          <button onClick={() => window.location.reload()} className="ml-2 underline font-bold">Retry</button>
        </div>
      )}

      {/* Screen Router */}
      {currentMode === CallMode.CHAT ? (
        <ChatScreen onClose={handleEnd} />
      ) : (
        (state === AppState.IDLE || state === AppState.ENDED || state === AppState.ERROR) ? (
            <StartScreen 
                onStart={handleStart} 
                isLoading={state === AppState.CONNECTING} 
            />
        ) : (
            <CallScreen 
                state={state} 
                volume={volume} 
                onEnd={handleEnd}
                mode={currentMode!}
                videoStream={videoStream}
            />
        )
      )}
    </div>
  );
};

export default App;
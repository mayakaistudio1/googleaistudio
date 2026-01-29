import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AppState } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from '../constants';
import { base64ToUint8Array, createPcmBlob, blobToBase64 } from '../utils/audioUtils';

export const useGeminiLive = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [volume, setVolume] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  // Video Refs
  const videoIntervalRef = useRef<number | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Playback Timing
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopAudio = useCallback(() => {
    // Stop video interval
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    
    // Stop microphone/camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setVideoStream(null);

    // Stop processing
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    // Stop playback
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Cleanup video elements
    videoCanvasRef.current = null;
    videoElementRef.current = null;
  }, []);

  const connect = useCallback(async (isVideoMode: boolean = false) => {
    setState(AppState.CONNECTING);
    setErrorMsg('');

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      nextStartTimeRef.current = 0;

      // Get Media Access
      const constraints = { 
        audio: true, 
        video: isVideoMode ? { width: 640, height: 480, frameRate: 15 } : false 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (isVideoMode) {
        setVideoStream(stream);
        // Setup hidden video/canvas for frame capture
        const vid = document.createElement('video');
        vid.srcObject = stream;
        vid.muted = true;
        vid.play();
        videoElementRef.current = vid;

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        videoCanvasRef.current = canvas;
      }

      // Start Session
      sessionPromiseRef.current = ai.live.connect({
        model: GEMINI_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setState(AppState.ACTIVE);

            // 1. Setup Audio Processing
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              let sum = 0;
              for(let i=0; i<inputData.length; i+=100) sum += Math.abs(inputData[i]);
              setVolume(Math.min(1, (sum / (inputData.length/100)) * 5));

              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);

            // 2. Setup Video Processing (if enabled)
            if (isVideoMode && videoElementRef.current && videoCanvasRef.current) {
              const ctx = videoCanvasRef.current.getContext('2d');
              const vid = videoElementRef.current;
              
              videoIntervalRef.current = window.setInterval(async () => {
                if (!ctx || !vid) return;
                ctx.drawImage(vid, 0, 0, 640, 480);
                
                // Convert to blob then base64
                videoCanvasRef.current?.toBlob(async (blob) => {
                    if (blob) {
                         const base64 = await blobToBase64(blob as any);
                         sessionPromiseRef.current?.then(session => {
                            session.sendRealtimeInput({ 
                                media: { mimeType: 'image/jpeg', data: base64 } 
                            });
                         });
                    }
                }, 'image/jpeg', 0.6); // 0.6 quality

              }, 500); // 2 FPS (Keep low for latency/tokens in this demo)
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const ctx = outputAudioContextRef.current;
            if (!ctx) return;

            // Handle Audio
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
               const uint8 = base64ToUint8Array(audioData);
               const int16 = new Int16Array(uint8.buffer);
               const float32 = new Float32Array(int16.length);
               for(let i=0; i<int16.length; i++) {
                 float32[i] = int16[i] / 32768.0;
               }

               const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
               audioBuffer.getChannelData(0).set(float32);

               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               
               const gainNode = ctx.createGain();
               gainNode.gain.value = 1.2; 
               source.connect(gainNode);
               gainNode.connect(ctx.destination);

               const currentTime = ctx.currentTime;
               if (nextStartTimeRef.current < currentTime) {
                   nextStartTimeRef.current = currentTime;
               }
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               
               sourcesRef.current.add(source);
               source.onended = () => sourcesRef.current.delete(source);
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            setState(AppState.ENDED);
          },
          onerror: (e) => {
            console.error("Gemini Live Error", e);
            setErrorMsg("Connection failed. Please try again.");
            setState(AppState.ERROR);
          }
        }
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to start");
      setState(AppState.ERROR);
    }
  }, []);

  const disconnect = useCallback(() => {
    stopAudio();
    sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
    setState(AppState.ENDED);
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    state,
    volume,
    connect,
    disconnect,
    errorMsg,
    videoStream
  };
};
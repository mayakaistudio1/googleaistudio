import { useState, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { ChatMessage } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from '../constants';

export const useGeminiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  const initChat = () => {
    if (chatSessionRef.current) return;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;

    const ai = new GoogleGenAI({ apiKey });
    chatSessionRef.current = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    
    // Add initial greeting from persona
    setMessages([{
      id: 'init',
      role: 'model',
      text: 'Привет! Я WOW-Agent. Я здесь, чтобы показать тебе силу живого общения. Чем могу помочь?'
    }]);
  };

  const sendMessage = async (text: string) => {
    if (!chatSessionRef.current || !text.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Stream response
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: text });
      
      const modelMsgId = (Date.now() + 1).toString();
      let fullText = "";
      
      // Add placeholder for model response
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: "" }]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || "";
        fullText += chunkText;
        
        setMessages(prev => prev.map(msg => 
          msg.id === modelMsgId ? { ...msg, text: fullText } : msg
        ));
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Произошла ошибка. Попробуйте еще раз." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage, initChat };
};
export enum AppState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  ENDED = 'ENDED'
}

export enum CallMode {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  CHAT = 'CHAT'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface AudioVisualizerState {
  isUserSpeaking: boolean;
  isAgentSpeaking: boolean;
  volume: number;
}
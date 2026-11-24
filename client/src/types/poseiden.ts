export type ChatMode = 'learning' | 'immersion';

export type Sender = 'user' | 'poseiden' | 'system';

export type PatienceLevel = 0 | 1 | 2 | 3;

export type MoodLevel = 'calm' | 'agitated' | 'furious' | 'refusal';

export type TributeLevel = 'minor' | 'medium' | 'grand';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  modeAtCreation: ChatMode;
  citation?: string;
  isTributeAcceptance?: boolean;
  isEasterEgg?: boolean;
}

export interface TributeOffering {
  id: string;
  label: string;
  tier: TributeLevel;
  patienceRestore: 1 | 3 | 5;
  isCursed?: boolean;
}

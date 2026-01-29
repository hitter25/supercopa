export enum ScreenState {
  WELCOME = 'WELCOME',
  TEAM_SELECTION = 'TEAM_SELECTION',
  IDOL_SELECTION = 'IDOL_SELECTION',
  INSTRUCTION = 'INSTRUCTION',
  CAMERA = 'CAMERA',
  GENERATION = 'GENERATION',
  RESULT = 'RESULT',
  WHATSAPP = 'WHATSAPP'
}

export enum TeamId {
  FLAMENGO = 'FLAMENGO',
  CORINTHIANS = 'CORINTHIANS'
}

export interface Idol {
  id: string;
  name: string;
  nickname: string;
  position: string;
  era: string;
  teamId: TeamId;
  imageUrl: string;
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

// Database types for Supabase
export interface DbSession {
  id: string;
  team_id: string | null;
  idol_id: string | null;
  image_size: string;
  current_screen: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbGeneratedImage {
  id: string;
  session_id: string | null;
  team_id: string | null;
  idol_id: string | null;
  image_size: string;
  storage_path: string | null;
  storage_url: string | null;
  image_base64: string | null;
  prompt_used: string | null;
  generation_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbWhatsAppShare {
  id: string;
  session_id: string | null;
  generated_image_id: string | null;
  phone_number: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Extended for Zustand store
export interface AppState {
  // Session
  sessionId: string | null;

  // State
  currentScreen: ScreenState;
  selectedTeam: TeamId | null;
  selectedIdol: Idol | null;
  capturedImage: string | null;
  capturedImageUrl: string | null;
  generatedImage: string | null;
  generatedImageUrl: string | null;
  generatedImageId: string | null;
  imageSize: ImageSize;
  isLoading: boolean;

  // Actions
  setSessionId: (id: string) => void;
  setScreen: (screen: ScreenState) => void;
  selectTeam: (team: TeamId) => void;
  selectIdol: (idol: Idol) => void;
  setCapturedImage: (img: string, url?: string) => void;
  setGeneratedImage: (img: string | null, url?: string, id?: string) => void;
  setImageSize: (size: ImageSize) => void;
  setLoading: (loading: boolean) => void;
  resetSession: () => void;
}
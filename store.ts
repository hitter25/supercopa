import { create } from 'zustand';
import { AppState, ScreenState, TeamId, Idol, ImageSize } from './types';

export const useAppStore = create<AppState>((set) => ({
  // Session
  sessionId: null,

  // State
  currentScreen: ScreenState.WELCOME,
  selectedTeam: null,
  selectedIdol: null,
  capturedImage: null,
  capturedImageUrl: null,
  generatedImage: null,
  generatedImageUrl: null,
  generatedImageId: null,
  imageSize: ImageSize.SIZE_2K,
  isLoading: false,

  // Actions
  setSessionId: (id: string) => set({ sessionId: id }),

  setScreen: (screen: ScreenState) => set({ currentScreen: screen }),

  selectTeam: (team: TeamId) => set({ selectedTeam: team }),

  selectIdol: (idol: Idol) => set({ selectedIdol: idol }),

  setCapturedImage: (img: string, url?: string) => set({
    capturedImage: img,
    capturedImageUrl: url || null
  }),

  setGeneratedImage: (img: string | null, url?: string, id?: string) => set({
    generatedImage: img,
    generatedImageUrl: url || null,
    generatedImageId: id || null
  }),

  setImageSize: (size: ImageSize) => set({ imageSize: size }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  resetSession: () => set({
    sessionId: null,
    currentScreen: ScreenState.WELCOME,
    selectedTeam: null,
    selectedIdol: null,
    capturedImage: null,
    capturedImageUrl: null,
    generatedImage: null,
    generatedImageUrl: null,
    generatedImageId: null,
    imageSize: ImageSize.SIZE_2K,
    isLoading: false
  })
}));

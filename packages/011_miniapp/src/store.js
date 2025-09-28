// store.js
import { create } from "zustand";

export const useMainStore = create((set) => ({
  selectedFilter: "Wallet",
  setSelectedFilter: (filter) => set((state) => ({ selectedFilter: filter })),
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

export const useConnectionsStore = create((set) => ({
  selectedFilter: "App",
  setSelectedFilter: (filter) => set((state) => ({ selectedFilter: filter })),
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

export const useNavStore = create((set) => ({
  navigate: null, // 초기값
  setNavigate: (navFn) => set({ navigate: navFn }),
}));

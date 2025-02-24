
import { create } from 'zustand'

type User = {
  id: string;
  email?: string;
} | null;

type Store = {
  user: User;
  setUser: (user: User) => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}))

import { create } from "zustand";
import type { Profile } from "@/types";

interface UserState {
  profile: Profile | null;
  isLoading: boolean;
  weightUnit: "kg" | "lbs";
  defaultRestSeconds: number;
  weightIncrement: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (data: Partial<Profile>) => void;
  setWeightUnit: (unit: "kg" | "lbs") => void;
  setDefaultRest: (seconds: number) => void;
  setWeightIncrement: (inc: number) => void;
}

export const useUserStore = create<UserState>()((set) => ({
  profile: null,
  isLoading: true,
  weightUnit: "kg",
  defaultRestSeconds: 90,
  weightIncrement: 2.5,
  soundEnabled: true,
  vibrationEnabled: true,

  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  updateProfile: (data) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...data } : null,
    })),
  setWeightUnit: (weightUnit) => set({ weightUnit }),
  setDefaultRest: (defaultRestSeconds) => set({ defaultRestSeconds }),
  setWeightIncrement: (weightIncrement) => set({ weightIncrement }),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProfileData {
  name: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  cycleLength: number; // default 28
  lastPeriodDate: string | null; // "YYYY-MM-DD"
}

interface ProfileState {
  profile: ProfileData;
  isLoggedIn: boolean;
  isOnboarded: boolean;
  email: string | null;
  setProfile: (profile: Partial<ProfileData>) => void;
  login: (email: string) => void;
  logout: () => void;
  setOnboarded: (onboarded: boolean) => void;
  resetAll: () => void;
}

const initialProfile: ProfileData = {
  name: "",
  age: null,
  height: null,
  weight: null,
  cycleLength: 28,
  lastPeriodDate: null,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      isLoggedIn: false,
      isOnboarded: false,
      email: null,
      setProfile: (updated) =>
        set((state) => ({
          profile: { ...state.profile, ...updated },
        })),
      login: (email) =>
        set({
          isLoggedIn: true,
          email,
        }),
      logout: () =>
        set({
          profile: initialProfile,
          isLoggedIn: false,
          isOnboarded: false,
          email: null,
        }),
      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
      resetAll: () =>
        set({
          profile: initialProfile,
          isLoggedIn: false,
          isOnboarded: false,
          email: null,
        }),
    }),
    {
      name: "sakhi-profile-store",
    }
  )
);

// Helper function to calculate current cycle day from the last period date
export const getCurrentCycleDay = (lastPeriodDate: string | null, cycleLength: number): number => {
  if (!lastPeriodDate) return 12; // fallback default
  const lastDate = new Date(lastPeriodDate);
  const today = new Date();
  
  // Normalize dates to midnight
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 1; // last period date is in the future
  
  return (diffDays % cycleLength) + 1;
};

// Helper function to get current cycle phase from the cycle day and length
export interface CalculatedPhase {
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  color: string;
}

export const getCyclePhase = (day: number, cycleLength: number): CalculatedPhase => {
  const mEnd = Math.max(3, Math.min(7, Math.floor(cycleLength * 0.18)));
  const fEnd = Math.floor(cycleLength * 0.46);
  const oEnd = Math.floor(cycleLength * 0.57);

  if (day <= mEnd) {
    return {
      name: "Menstrual Phase",
      description: "Your body sheds the uterine lining. Focus on rest, warm teas, and gentle stretching.",
      startDay: 1,
      endDay: mEnd,
      color: "#d56f96",
    };
  } else if (day <= fEnd) {
    return {
      name: "Follicular Phase",
      description: "Estrogen rises, boosting energy and focus. A wonderful time to plan, learn, and socialize.",
      startDay: mEnd + 1,
      endDay: fEnd,
      color: "#e89bb6",
    };
  } else if (day <= oEnd) {
    return {
      name: "Ovulatory Phase",
      description: "Estrogen and LH peak. You are at high energy, expressive, and physically active.",
      startDay: fEnd + 1,
      endDay: oEnd,
      color: "#8a5a78", // plum color
    };
  } else {
    return {
      name: "Luteal Phase",
      description: "Progesterone rises, winding down energy. Prioritize warm, grounding meals and mindful reflection.",
      startDay: oEnd + 1,
      endDay: cycleLength,
      color: "#4e364a", // deep plum
    };
  }
};

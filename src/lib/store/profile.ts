import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CycleLog } from "@/lib/cycle";
import { mockCycleLogs, mockJournalEntries } from "@/lib/mock-data";
import type { JSONContent } from "@tiptap/react";

export { getCurrentCycleDay, getCyclePhaseForDay as getCyclePhase } from "@/lib/cycle";

export interface ProfileData {
  name: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  cycleLength: number; // default 28
  lastPeriodDate: string | null; // "YYYY-MM-DD"
}

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO string
  contentJSON: JSONContent; // Tiptap JSON content
  contentText: string; // plain text for preview
  mood?: string;
  cyclePhase: string;
}

export interface ReminderPreferences {
  enabled: boolean;
  upcomingPeriod: boolean;
  dailyLogNudge: boolean;
  supplementAlert: boolean;
  time: string; // e.g. "09:00"
}

interface ProfileState {
  profile: ProfileData;
  isLoggedIn: boolean;
  isOnboarded: boolean;
  email: string | null;
  cycleLogs: Record<string, CycleLog>; // Keyed by YYYY-MM-DD
  journalEntries: JournalEntry[];
  reminders: ReminderPreferences;
  
  // Actions
  setProfile: (profile: Partial<ProfileData>) => void;
  login: (email: string) => void;
  logout: () => void;
  setOnboarded: (onboarded: boolean) => void;
  resetAll: () => void;
  
  // Cycle logs actions
  setCycleLog: (date: string, log: Partial<CycleLog>) => void;
  deleteCycleLog: (date: string) => void;
  
  // Journal actions
  addJournalEntry: (entry: { contentJSON: JSONContent; contentText: string; mood?: string; cyclePhase: string }) => void;
  updateJournalEntry: (id: string, contentJSON: JSONContent, contentText: string, mood?: string) => void;
  deleteJournalEntry: (id: string) => void;
  
  // Reminders actions
  updateReminders: (prefs: Partial<ReminderPreferences>) => void;
}

const initialProfile: ProfileData = {
  name: "",
  age: null,
  height: null,
  weight: null,
  cycleLength: 28,
  lastPeriodDate: null,
};

const initialReminders: ReminderPreferences = {
  enabled: false,
  upcomingPeriod: true,
  dailyLogNudge: true,
  supplementAlert: false,
  time: "09:00",
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      isLoggedIn: false,
      isOnboarded: false,
      email: null,
      cycleLogs: mockCycleLogs,
      journalEntries: mockJournalEntries,
      reminders: initialReminders,
      
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
          cycleLogs: {},
          journalEntries: [],
          reminders: initialReminders,
        }),
        
      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
      
      resetAll: () =>
        set({
          profile: initialProfile,
          isLoggedIn: false,
          isOnboarded: false,
          email: null,
          cycleLogs: {},
          journalEntries: [],
          reminders: initialReminders,
        }),
        
      // Cycle logs actions
      setCycleLog: (date, log) =>
        set((state) => {
          const existing = state.cycleLogs[date] || {
            date,
            isPeriod: false,
            symptoms: [],
          };
          return {
            cycleLogs: {
              ...state.cycleLogs,
              [date]: { ...existing, ...log },
            },
          };
        }),
        
      deleteCycleLog: (date) =>
        set((state) => {
          const updatedLogs = { ...state.cycleLogs };
          delete updatedLogs[date];
          return { cycleLogs: updatedLogs };
        }),
        
      // Journal actions
      addJournalEntry: (entry) =>
        set((state) => {
          const newEntry: JournalEntry = {
            id: `entry-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...entry,
          };
          return {
            journalEntries: [newEntry, ...state.journalEntries],
          };
        }),
        
      updateJournalEntry: (id, contentJSON, contentText, mood) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) =>
            e.id === id ? { ...e, contentJSON, contentText, ...(mood ? { mood } : {}) } : e
          ),
        })),
        
      deleteJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((e) => e.id !== id),
        })),
        
      // Reminders actions
      updateReminders: (prefs) =>
        set((state) => ({
          reminders: { ...state.reminders, ...prefs },
        })),
    }),
    {
      name: "sakhi-profile-store",
    }
  )
);

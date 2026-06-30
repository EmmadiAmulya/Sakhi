import { format, subDays } from "date-fns";
import { CycleLog } from "./cycle";

export interface CyclePhase {
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  color: string;
}

export interface CycleStatus {
  currentDay: number;
  cycleLength: number;
  periodLength: number;
  daysUntilNextPeriod: number;
  currentPhase: CyclePhase;
  phaseProgress: number; // percentage (0-100)
}

export interface DailyHabits {
  waterIntake: number; // in ml
  waterTarget: number; // in ml
  sleepHours: number;
  sleepTarget: number;
  mood: "serene" | "energetic" | "sensitive" | "fatigued" | "reflective";
  energy: number; // 1 to 5
}

export interface Supplement {
  id: string;
  name: string;
  dosage: string;
  timeOfDay: string;
  taken: boolean;
}

export interface CompanionMessage {
  id: string;
  sender: "user" | "companion" | "guide";
  text: string;
  timestamp: string;
}

export const CYCLE_PHASES: CyclePhase[] = [
  {
    name: "Menstrual Phase",
    description: "Your body sheds the uterine lining. Focus on rest, warm teas, and gentle stretching.",
    startDay: 1,
    endDay: 5,
    color: "#d56f96",
  },
  {
    name: "Follicular Phase",
    description: "Estrogen rises, boosting energy and focus. A wonderful time to plan, learn, and socialize.",
    startDay: 6,
    endDay: 13,
    color: "#e89bb6",
  },
  {
    name: "Ovulatory Phase",
    description: "Estrogen and LH peak. You are at high energy, expressive, and physically active.",
    startDay: 14,
    endDay: 16,
    color: "#plum",
  },
  {
    name: "Luteal Phase",
    description: "Progesterone rises, winding down energy. Prioritize warm, grounding meals and mindful reflection.",
    startDay: 17,
    endDay: 28,
    color: "#8a5a78",
  },
];

export const mockCycleStatus: CycleStatus = {
  currentDay: 12,
  cycleLength: 28,
  periodLength: 5,
  daysUntilNextPeriod: 16,
  currentPhase: CYCLE_PHASES[1], // Follicular Phase
  phaseProgress: 75, // 6 out of 8 days completed in this phase
};

export const mockDailyHabits: DailyHabits = {
  waterIntake: 1200,
  waterTarget: 2000,
  sleepHours: 7.5,
  sleepTarget: 8,
  mood: "serene",
  energy: 4,
};

export const mockSupplements: Supplement[] = [
  { id: "sup-1", name: "Folic Acid", dosage: "400 mcg", timeOfDay: "Morning", taken: true },
  { id: "sup-2", name: "Vitamin D3", dosage: "2000 IU", timeOfDay: "Morning", taken: true },
  { id: "sup-3", name: "Magnesium Glycinate", dosage: "200 mg", timeOfDay: "Evening", taken: false },
  { id: "sup-4", name: "Omega 3 Fish Oil", dosage: "1000 mg", timeOfDay: "Afternoon", taken: false },
];

export const mockCompanionMessages: CompanionMessage[] = [
  {
    id: "msg-1",
    sender: "companion",
    text: "Welcome back, Amulya. You are on day 12 of your cycle. Since you're in the follicular phase, you might feel a pleasant rise in focus today. How is your energy holding up?",
    timestamp: "10:30 AM",
  },
  {
    id: "msg-2",
    sender: "user",
    text: "I'm feeling good, just a little dehydrated today.",
    timestamp: "10:32 AM",
  },
  {
    id: "msg-3",
    sender: "companion",
    text: "Dehydration can sneak up on us as metabolic energy rises. Let's aim to sip a warm glass of water. Would you like me to log 250ml for you now?",
    timestamp: "10:33 AM",
  },
];

export const mockGuideMessages: CompanionMessage[] = [
  {
    id: "gmsg-1",
    sender: "guide",
    text: "Hello. I am your clinical reference helper. I can summarize peer-reviewed research regarding cycle synchronization, hormonal pathways, and nutritional support. Ask me any clinical questions.",
    timestamp: "Yesterday",
  },
];

// Generate past 30 days of cycle logs programmatically relative to today
const generateMockLogs = () => {
  const logs: Record<string, CycleLog> = {};
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");

    // Map a standard 28-day cycle:
    // Days 1-5: Menstrual (Period)
    // Days 6-12: Follicular
    // Days 13-15: Ovulatory
    // Days 16-28: Luteal
    const cycleDay = (30 - i) % 28 || 28;

    let isPeriod = false;
    let flow: "spotting" | "light" | "medium" | "heavy" | undefined = undefined;
    let symptoms: string[] = [];
    let mood = "serene";
    let energy = 3;
    let note = "";

    if (cycleDay <= 5) {
      isPeriod = true;
      flow = cycleDay === 1 || cycleDay === 5 ? "light" : "heavy";
      symptoms = cycleDay === 2 ? ["Cramps", "Fatigue"] : ["Fatigue"];
      mood = "fatigued";
      energy = 2;
      note = `Day ${cycleDay} of period. Resting as much as possible.`;
    } else if (cycleDay <= 12) {
      isPeriod = false;
      symptoms = [];
      mood = "energetic";
      energy = 4;
      note = "Feeling sharp and motivated to work.";
    } else if (cycleDay <= 15) {
      isPeriod = false;
      symptoms = [];
      mood = "serene";
      energy = 5;
      note = "Extremely positive energy and clear head space.";
    } else {
      isPeriod = false;
      symptoms = cycleDay >= 26 ? ["Bloating", "Headache"] : [];
      mood = cycleDay >= 25 ? "sensitive" : "reflective";
      energy = 3;
      note = cycleDay >= 26 ? "Slight PMS signs appearing." : "Feeling balanced but winded down.";
    }

    logs[dateStr] = {
      date: dateStr,
      isPeriod,
      flow,
      symptoms,
      mood,
      energy,
      note,
    };
  }

  return logs;
};

export const mockCycleLogs = generateMockLogs();

// Generate starting journal entries
export const mockJournalEntries = [
  {
    id: "entry-mock-1",
    createdAt: subDays(new Date(), 1).toISOString(),
    contentJSON: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Reflecting on Energy Shift" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "As I enter my luteal phase, I can feel a distinct shift in my physical drive. Yesterday, I wanted to jump on HIIT workouts, but today my body is calling for stretching and cozy tea. Giving myself full permission to rest.",
            },
          ],
        },
      ],
    },
    contentText: "Reflecting on Energy Shift\nAs I enter my luteal phase, I can feel a distinct shift in my physical drive. Yesterday, I wanted to jump on HIIT workouts, but today my body is calling for stretching and cozy tea. Giving myself full permission to rest.",
    mood: "reflective",
    cyclePhase: "Luteal Phase",
  },
  {
    id: "entry-mock-2",
    createdAt: subDays(new Date(), 5).toISOString(),
    contentJSON: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Creativity Boost" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Estrogen is rising! Handled all design alignments and spent two hours brainstorming with the developer. The ideas felt flowy and clear. Definitely matching my follicular energy curve.",
            },
          ],
        },
      ],
    },
    contentText: "Creativity Boost\nEstrogen is rising! Handled all design alignments and spent two hours brainstorming with the developer. The ideas felt flowy and clear. Definitely matching my follicular energy curve.",
    mood: "energetic",
    cyclePhase: "Follicular Phase",
  },
];

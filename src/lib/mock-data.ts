import { format, subDays } from "date-fns";
import { CycleLog } from "./cycle";

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

import { addDays, differenceInDays, parseISO, format, isSameDay } from "date-fns";

export interface CycleLog {
  date: string; // "YYYY-MM-DD"
  isPeriod: boolean;
  flow?: "spotting" | "light" | "medium" | "heavy";
  symptoms: string[];
  mood?: string;
  energy?: number; // 1 to 5
  note?: string;
}

export interface CyclePhase {
  id: "menstrual" | "follicular" | "ovulatory" | "luteal";
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  color: string;
}

export interface CalculatedCycle {
  cycleDay: number;
  phase: CyclePhase;
  daysUntilNextPeriod: number;
  nextPeriodDate: Date;
  ovulationDate: Date;
  fertileWindow: Date[];
  periodWindow: Date[];
  isFertile: boolean;
  isPeriodDay: boolean;
}

// Proportional phase calculations based on refined cycle parameters
export const getCyclePhaseForDay = (
  day: number,
  cycleLength: number,
  periodLength: number = 5
): CyclePhase => {
  const ovulationDay = Math.max(periodLength + 3, cycleLength - 14);
  
  if (day <= periodLength) {
    return {
      id: "menstrual",
      name: "Menstrual Phase",
      description: "Your body sheds the uterine lining. Rest and gentle stretches are key.",
      startDay: 1,
      endDay: periodLength,
      color: "#d56f96", // Sakura pink
    };
  } else if (day < ovulationDay - 1) {
    return {
      id: "follicular",
      name: "Follicular Phase",
      description: "Estrogen rises, boosting physical energy, focus, and social engagement.",
      startDay: periodLength + 1,
      endDay: ovulationDay - 2,
      color: "#e89bb6", // Lighter pink
    };
  } else if (day <= ovulationDay + 1) {
    return {
      id: "ovulatory",
      name: "Ovulatory Phase",
      description: "Estrogen peaks and LH surge triggers ovulation. High energy and libido.",
      startDay: ovulationDay - 1,
      endDay: ovulationDay + 1,
      color: "#8a5a78", // Deep Plum
    };
  } else {
    return {
      id: "luteal",
      name: "Luteal Phase",
      description: "Progesterone dominates, winding down energy. Prioritize warm, grounding meals.",
      startDay: ovulationDay + 2,
      endDay: cycleLength,
      color: "#4e364a", // Dark Plum
    };
  }
};

// Refine cycle lengths and period lengths from log history
export const refineCycleMetrics = (
  logs: CycleLog[],
  defaultCycleLength: number = 28,
  defaultPeriodLength: number = 5
): { cycleLength: number; periodLength: number } => {
  if (logs.length === 0) {
    return { cycleLength: defaultCycleLength, periodLength: defaultPeriodLength };
  }

  // Sort logs chronologically
  const sortedLogs = [...logs]
    .filter((l) => l.isPeriod)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sortedLogs.length === 0) {
    return { cycleLength: defaultCycleLength, periodLength: defaultPeriodLength };
  }

  // Find period runs (consecutive days of isPeriod === true)
  const runs: Date[][] = [];
  let currentRun: Date[] = [];

  sortedLogs.forEach((log) => {
    const logDate = parseISO(log.date);
    if (currentRun.length === 0) {
      currentRun.push(logDate);
    } else {
      const prevDate = currentRun[currentRun.length - 1];
      const diff = differenceInDays(logDate, prevDate);
      if (diff <= 1.5) { // Consecutive day (or near enough)
        currentRun.push(logDate);
      } else {
        runs.push(currentRun);
        currentRun = [logDate];
      }
    }
  });
  if (currentRun.length > 0) {
    runs.push(currentRun);
  }

  // Calculate average period run length
  const periodLengths = runs.map((run) => run.length);
  const avgPeriodLength = periodLengths.length > 0
    ? Math.round(periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length)
    : defaultPeriodLength;

  // Calculate cycle lengths (days between start dates of consecutive runs)
  const cycleLengths: number[] = [];
  for (let i = 1; i < runs.length; i++) {
    const prevStart = runs[i - 1][0];
    const currentStart = runs[i][0];
    const cycleDays = differenceInDays(currentStart, prevStart);
    // Ignore outlier cycle lengths (e.g. less than 15 or greater than 50 days)
    if (cycleDays >= 15 && cycleDays <= 50) {
      cycleLengths.push(cycleDays);
    }
  }

  const avgCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length)
    : defaultCycleLength;

  return {
    cycleLength: Math.max(21, Math.min(40, avgCycleLength)),
    periodLength: Math.max(3, Math.min(10, avgPeriodLength)),
  };
};

// Calculate entire predicted cycle timeline properties
export const calculateCycle = (
  lastPeriodDateStr: string | null,
  cycleLength: number,
  periodLength: number,
  targetDate: Date = new Date()
): CalculatedCycle => {
  const lastPeriodDate = lastPeriodDateStr ? parseISO(lastPeriodDateStr) : new Date();
  
  // Set times to midnight
  lastPeriodDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  // Compute number of days between targetDate and lastPeriodDate
  const diffDays = differenceInDays(targetDate, lastPeriodDate);
  
  let cycleDay = 12; // Default fallback cycle day
  let currentPeriodStartDate = lastPeriodDate;

  if (diffDays >= 0) {
    cycleDay = (diffDays % cycleLength) + 1;
    const cycleCount = Math.floor(diffDays / cycleLength);
    currentPeriodStartDate = addDays(lastPeriodDate, cycleCount * cycleLength);
  } else {
    // Target is in the past before last period
    const absDiff = Math.abs(diffDays);
    const cycleCount = Math.ceil(absDiff / cycleLength);
    currentPeriodStartDate = addDays(lastPeriodDate, -cycleCount * cycleLength);
    const correctedDiff = differenceInDays(targetDate, currentPeriodStartDate);
    cycleDay = correctedDiff + 1;
  }

  const nextPeriodDate = addDays(currentPeriodStartDate, cycleLength);
  const daysUntilNextPeriod = differenceInDays(nextPeriodDate, targetDate);

  const phase = getCyclePhaseForDay(cycleDay, cycleLength, periodLength);
  const ovulationDayIndex = Math.max(periodLength + 3, cycleLength - 14);
  const ovulationDate = addDays(currentPeriodStartDate, ovulationDayIndex - 1);

  // Fertile window: 5 days pre-ovulation + ovulation day
  const fertileWindow: Date[] = [];
  for (let i = -5; i <= 0; i++) {
    fertileWindow.push(addDays(ovulationDate, i));
  }

  // Predicted period days
  const periodWindow: Date[] = [];
  for (let i = 0; i < periodLength; i++) {
    periodWindow.push(addDays(currentPeriodStartDate, i));
  }

  const isFertile = fertileWindow.some((d) => isSameDay(d, targetDate));
  const isPeriodDay = periodWindow.some((d) => isSameDay(d, targetDate));

  return {
    cycleDay,
    phase,
    daysUntilNextPeriod,
    nextPeriodDate,
    ovulationDate,
    fertileWindow,
    periodWindow,
    isFertile,
    isPeriodDay,
  };
};

// Generate descriptive screen-reader labels for days
export const getAriaLabelForDay = (
  date: Date,
  calc: CalculatedCycle,
  log?: CycleLog
): string => {
  const dateFormatted = format(date, "MMMM d, yyyy");
  let status = `Cycle day ${calc.cycleDay}, ${calc.phase.name}.`;

  if (calc.isPeriodDay) status += " Predicted period day.";
  if (calc.isFertile) status += " High fertility window.";
  if (isSameDay(date, calc.ovulationDate)) status += " Estimated ovulation day.";

  if (log) {
    if (log.isPeriod) status += ` Logged period day (${log.flow || "medium"} flow).`;
    if (log.symptoms.length > 0) status += ` Symptoms: ${log.symptoms.join(", ")}.`;
    if (log.mood) status += ` Mood: ${log.mood}.`;
  }

  return `${dateFormatted}. ${status}`;
};

export const getCurrentCycleDay = (lastPeriodDateStr: string | null, cycleLength: number): number => {
  if (!lastPeriodDateStr) return 12; // fallback default
  const lastPeriodDate = parseISO(lastPeriodDateStr);
  const today = new Date();
  
  // Normalize times to midnight
  lastPeriodDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = differenceInDays(today, lastPeriodDate);
  if (diffDays < 0) return 1;

  return (diffDays % cycleLength) + 1;
};

import { format } from "date-fns";

/** Shared local day boundary: "yyyy-MM-dd". */
export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Local wall-clock time for chat bubbles, e.g. "09:41 PM". */
export function formatClockTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

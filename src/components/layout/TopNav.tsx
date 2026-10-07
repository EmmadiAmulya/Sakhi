"use client";

import React, { useEffect, useRef, useState } from "react";
import { Heart, Bell } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore, getCurrentCycleDay, getCyclePhase } from "@/lib/store/profile";

export default function TopNav({ onProfileClick }: { onProfileClick?: () => void }) {
  const profile = useProfileStore((state) => state.profile);
  const reminders = useProfileStore((state) => state.reminders);
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const hasCycleData = !!profile.lastPeriodDate;
  const cycleDay = hasCycleData
    ? getCurrentCycleDay(profile.lastPeriodDate, profile.cycleLength)
    : null;
  const phase = cycleDay !== null ? getCyclePhase(cycleDay, profile.cycleLength) : null;
  const daysUntilNextPeriod = cycleDay !== null ? profile.cycleLength - cycleDay : null;
  const showBadge = daysUntilNextPeriod !== null && daysUntilNextPeriod <= 2;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const displayName = profile.name || "Amulya";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/70 bg-surface-glass/85 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left Side: Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sakura-deep/15">
              <Heart className="h-4.5 w-4.5 text-sakura-deep fill-sakura-deep/30" />
            </div>
            <span className="font-serif text-xl font-bold tracking-wider text-ink-text">
              さき <span className="text-sakura-deep">Sakhi</span>
            </span>
          </div>
        </div>

        {/* Right Side: Notification and User Profile */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={bellRef}>
            <GlassButton
              variant="ghost"
              className="p-2 rounded-full h-10 w-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep/50"
              aria-label="Notifications"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <Bell className="h-4.5 w-4.5 text-ink-soft" />
              {showBadge && <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-sakura-deep" />}
            </GlassButton>
            {open && (
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-sakura-deep/25 bg-[#f8eaf1] p-4 text-left shadow-glass">
                {!hasCycleData ? (
                  <p className="text-xs text-ink-soft">
                    Add your last period date in Settings to get cycle alerts.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-ink-text">
                      Next period in {daysUntilNextPeriod} {daysUntilNextPeriod === 1 ? "day" : "days"}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Day {cycleDay} &bull; {phase?.name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Period predictions: {reminders.upcomingPeriod ? "On" : "Off"}
                    </p>
                    <p className="text-[10px] text-ink-soft">Reminders fire while Sakhi is open.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onProfileClick}
            aria-label="Open profile settings"
            className="flex items-center gap-2 pl-2 rounded-full transition-colors hover:bg-sakura/15 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep/50"
          >
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-ink-text">{displayName}</span>
              <span className="text-[10px] text-ink-soft font-medium">
                {hasCycleData && phase ? (
                  <>Day {cycleDay} &bull; {phase.name}</>
                ) : (
                  "Cycle not set up"
                )}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full border border-sakura/50 bg-sakura/20 flex items-center justify-center font-bold text-xs text-plum select-none">
              {userInitials}
            </div>
          </button>
        </div>

      </div>
    </header>
  );
}

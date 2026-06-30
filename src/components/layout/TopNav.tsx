"use client";

import React from "react";
import { Heart, Bell } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore, getCurrentCycleDay, getCyclePhase } from "@/lib/store/profile";

export default function TopNav() {
  const profile = useProfileStore((state) => state.profile);

  // Dynamic cycle day & phase computation
  const cycleDay = getCurrentCycleDay(profile.lastPeriodDate, profile.cycleLength);
  const phase = getCyclePhase(cycleDay, profile.cycleLength);

  // Fallback for names
  const displayName = profile.name || "Amulya";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/70 bg-surface-glass/85 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
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
          <GlassButton variant="ghost" className="p-2 rounded-full h-10 w-10 relative" aria-label="Notifications">
            <Bell className="h-4.5 w-4.5 text-ink-soft" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-sakura-deep" />
          </GlassButton>
          
          <div className="flex items-center gap-2 pl-2">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-ink-text">{displayName}</span>
              <span className="text-[10px] text-ink-soft font-medium">
                Day {cycleDay} &bull; {phase.name}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full border border-sakura/50 bg-sakura/20 flex items-center justify-center font-bold text-xs text-plum select-none">
              {userInitials}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}

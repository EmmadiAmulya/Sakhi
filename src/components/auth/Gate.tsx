"use client";

import React, { useState, useEffect } from "react";
import { useProfileStore } from "@/lib/store/profile";
import LoginView from "./LoginView";
import OnboardingForm from "./OnboardingForm";

interface GateProps {
  children: React.ReactNode;
}

export default function Gate({ children }: GateProps) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const isLoggedIn = useProfileStore((state) => state.isLoggedIn);
  const isOnboarded = useProfileStore((state) => state.isOnboarded);

  useEffect(() => {
    let active = true;
    const checkHydration = () => {
      if (!active) return;
      if (useProfileStore.persist.hasHydrated()) {
        setHasHydrated(true);
      } else {
        setTimeout(checkHydration, 20);
      }
    };
    checkHydration();
    return () => {
      active = false;
    };
  }, []);

  // Hydration guard: show a subtle loading spinner to prevent Server/Client mismatch
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center relative w-full z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-sakura-deep border-t-transparent animate-spin" />
          <span className="text-[10px] font-semibold text-plum tracking-wider uppercase animate-pulse">
            Loading Sakhi...
          </span>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!isLoggedIn) {
    return <LoginView />;
  }

  // Onboarding gate
  if (!isOnboarded) {
    return <OnboardingForm />;
  }

  return <>{children}</>;
}

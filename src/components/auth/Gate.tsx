"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useProfileStore } from "@/lib/store/profile";
import LoginView from "./LoginView";
import OnboardingForm from "./OnboardingForm";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";

interface GateProps {
  children: React.ReactNode;
}

/**
 * Gate handles ONLY routing: session → profile → (login | onboarding | app).
 *
 * It intentionally does NOT bulk-load cycle/journal/reminder data anymore — each
 * view lazy-loads its own data through the Phase 1 TanStack Query hooks. This
 * keeps the gate fast and its loading state always resolvable.
 *
 * Deadlock fix: we never `await` Supabase calls inside the `onAuthStateChange`
 * callback (that trips supabase-js's internal auth lock and hangs the app). The
 * callback only sets `user` synchronously; the profile fetch runs in a separate
 * effect keyed on the user id. All state updates happen inside async callbacks,
 * never synchronously in an effect body (avoids cascading-render lint + flashes).
 */
export default function Gate({ children }: GateProps) {
  const [supabase] = useState(() => createClient());

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // The user id whose profile routing decision has been resolved. When this
  // matches the current user, routing is settled and we can leave the spinner.
  const [routedUserId, setRoutedUserId] = useState<string | null>(null);
  const [dbOnboarded, setDbOnboarded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const setProfileInStore = useProfileStore((state) => state.setProfile);
  const setOnboardedInStore = useProfileStore((state) => state.setOnboarded);
  const loginInStore = useProfileStore((state) => state.login);
  const logoutInStore = useProfileStore((state) => state.logout);

  // 1) Resolve the session and subscribe to auth changes.
  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!active) return;
        if (error) {
          console.error("[Gate] getSession error:", error.message);
          setErrorMessage(`Auth error: ${error.message}`);
        }
        setUser(session?.user ?? null);
        setAuthChecked(true);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[Gate] getSession threw:", err);
        setErrorMessage(err instanceof Error ? err.message : "Failed to verify session.");
        setAuthChecked(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // SYNCHRONOUS ONLY — do not await Supabase calls here (deadlock risk).
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthChecked(true);
      if (!session?.user) {
        setRoutedUserId(null);
        setDbOnboarded(false);
        logoutInStore();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, logoutInStore, reloadKey]);

  // 2) Fetch ONLY the profile row for routing, keyed on the user id.
  useEffect(() => {
    if (!user) return;
    const uid = user.id;
    const email = user.email ?? "";
    let active = true;

    (async () => {
      setErrorMessage(null);
      loginInStore(email);
      try {
        // .maybeSingle(): no profile row is a valid state → route to onboarding.
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, name, age, height_cm, weight_kg, cycle_length, last_period_date, onboarded")
          .eq("id", uid)
          .maybeSingle();

        if (!active) return;

        if (error) {
          // Surface the ACTUAL Supabase error (e.g. PGRST205 = migration not applied).
          console.error("[Gate] profile fetch error:", error.code, error.message);
          setErrorMessage(`Database error: ${error.message}`);
          return;
        }

        if (profile) {
          setProfileInStore({
            name: profile.name || "",
            age: profile.age,
            height: profile.height_cm != null ? Number(profile.height_cm) : null,
            weight: profile.weight_kg != null ? Number(profile.weight_kg) : null,
            cycleLength: profile.cycle_length || 28,
            lastPeriodDate: profile.last_period_date || null,
          });
          setOnboardedInStore(Boolean(profile.onboarded));
          setDbOnboarded(Boolean(profile.onboarded));
        } else {
          setOnboardedInStore(false);
          setDbOnboarded(false);
        }
        setRoutedUserId(uid);
      } catch (err) {
        if (!active) return;
        console.error("[Gate] profile fetch threw:", err);
        setErrorMessage(
          err instanceof Error ? err.message : "Unexpected error loading your profile."
        );
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, reloadKey]);

  const retry = useCallback(() => {
    setErrorMessage(null);
    setAuthChecked(false);
    setRoutedUserId(null);
    setReloadKey((k) => k + 1);
  }, []);

  // Loading while checking auth, or while a signed-in user's profile routing
  // decision is still pending (and no error has surfaced).
  const loading =
    !errorMessage && (!authChecked || (user != null && routedUserId !== user.id));

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md z-10">
          <GlassCard className="p-8 text-center space-y-6 rounded-3xl border border-border bg-gradient-to-tr from-surface-white/40 via-surface-white/20 to-surface-white/50 backdrop-blur-xl saturate-[140%] shadow-glass shadow-glass-inset">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-xl font-bold text-ink-text">Unable to load Sakhi</h1>
              <p className="text-xs text-ink-soft leading-relaxed px-2">{errorMessage}</p>
            </div>
            <div className="pt-2">
              <GlassButton
                variant="primary"
                onClick={retry}
                className="w-full py-3 text-xs font-semibold"
              >
                Retry Connection
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (loading) {
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

  if (!user) {
    return <LoginView />;
  }

  if (!dbOnboarded) {
    return <OnboardingForm onSuccess={() => setDbOnboarded(true)} />;
  }

  return <>{children}</>;
}

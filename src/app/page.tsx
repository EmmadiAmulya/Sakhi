"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import DashboardView from "@/components/dashboard/DashboardView";
import PersonaChat from "@/components/chat/PersonaChat";
import SettingsView from "@/components/dashboard/SettingsView";
import CalendarView from "@/components/cycle/CalendarView";
import JournalView from "@/components/journal/JournalView";
import { JournalErrorBoundary } from "@/components/journal/JournalErrorBoundary";
import Gate from "@/components/auth/Gate";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  return (
    <Gate>
      <AppShell>
        {(activeTab, setActiveTab) => (
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <DashboardView key="dashboard" setActiveTab={setActiveTab} />
            )}
            {activeTab === "cycle" && (
              <CalendarView key="cycle" />
            )}
            {activeTab === "sakhi" && (
              <PersonaChat key="sakhi" personaId="sakhi" setActiveTab={setActiveTab} />
            )}
            {activeTab === "maya" && (
              <PersonaChat key="maya" personaId="maya" setActiveTab={setActiveTab} />
            )}
            {activeTab === "journal" && (
              <JournalErrorBoundary key="journal">
                <JournalView />
              </JournalErrorBoundary>
            )}
            {activeTab === "settings" && (
              <SettingsView key="settings" />
            )}
          </AnimatePresence>
        )}
      </AppShell>
    </Gate>
  );
}

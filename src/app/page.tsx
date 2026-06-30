"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import DashboardView from "@/components/dashboard/DashboardView";
import SakhiView from "@/components/dashboard/SakhiView";
import MayaView from "@/components/dashboard/MayaView";
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
              <SakhiView key="sakhi" setActiveTab={setActiveTab} />
            )}
            {activeTab === "maya" && (
              <MayaView key="maya" setActiveTab={setActiveTab} />
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

"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import DashboardView from "@/components/dashboard/DashboardView";
import CompanionView from "@/components/dashboard/CompanionView";
import GuideView from "@/components/dashboard/GuideView";
import SettingsView from "@/components/dashboard/SettingsView";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  return (
    <AppShell>
      {(activeTab, setActiveTab) => (
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <DashboardView key="dashboard" setActiveTab={setActiveTab} />
          )}
          {activeTab === "companion" && (
            <CompanionView key="companion" />
          )}
          {activeTab === "guide" && (
            <GuideView key="guide" />
          )}
          {activeTab === "settings" && (
            <SettingsView key="settings" />
          )}
        </AnimatePresence>
      )}
    </AppShell>
  );
}

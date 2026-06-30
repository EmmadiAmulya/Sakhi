"use client";

import React, { useState } from "react";
import TopNav from "./TopNav";
import DockNav from "./DockNav";

interface AppShellProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      {/* Fixed top glass branding bar - sibling above the scroll content to avoid Lenis transforms */}
      <TopNav />
      
      {/* Content wrapper with top clearances for TopNav and bottom clearances for DockNav */}
      <div className="flex-1 flex relative w-full pt-20 pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">
        <main className="flex-1 w-full transition-all duration-300">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 w-full">
            {children(activeTab, setActiveTab)}
          </div>
        </main>
      </div>

      {/* Floating glass macOS-style navigation dock */}
      <DockNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

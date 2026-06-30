"use client";

import React, { useState } from "react";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex-1 flex relative w-full">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        {/* Main responsive content panel */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] md:pl-64 transition-all duration-300 w-full">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 w-full">
            {children(activeTab, setActiveTab)}
          </div>
        </main>
      </div>
    </div>
  );
}

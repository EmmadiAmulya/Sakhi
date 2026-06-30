"use client";

import React from "react";
import { LayoutDashboard, CalendarHeart, Heart, Stethoscope, BookOpen, Settings } from "lucide-react";
import Dock, { DockItemData } from "@/components/Dock";

interface DockNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DockNav({ activeTab, setActiveTab }: DockNavProps) {
  const dockItems: DockItemData[] = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      onClick: () => setActiveTab("dashboard"),
      isActive: activeTab === "dashboard",
    },
    {
      label: "Cycle Tracker",
      icon: <CalendarHeart className="h-5 w-5 text-sakura-deep" />,
      onClick: () => setActiveTab("cycle"),
      isActive: activeTab === "cycle",
    },
    {
      label: "Sakhi Chat",
      icon: <Heart className="h-5 w-5 text-sakura-deep" />,
      onClick: () => setActiveTab("sakhi"),
      isActive: activeTab === "sakhi",
    },
    {
      label: "Maya Guide",
      icon: <Stethoscope className="h-5 w-5 text-plum" />,
      onClick: () => setActiveTab("maya"),
      isActive: activeTab === "maya",
    },
    {
      label: "Journal",
      icon: <BookOpen className="h-5 w-5 text-plum" />,
      onClick: () => setActiveTab("journal"),
      isActive: activeTab === "journal",
    },
    {
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      onClick: () => setActiveTab("settings"),
      isActive: activeTab === "settings",
    },
  ];

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-nav w-fit max-w-[calc(100%-2rem)] pb-[env(safe-area-inset-bottom,0px)]"
      id="dock-navigation"
    >
      <Dock
        items={dockItems}
        baseItemSize={38} // slightly smaller to comfortably fit 6 items on mobile viewports
        panelHeight={58}
        magnification={54}
        distance={120}
        spring={{ mass: 0.1, stiffness: 350, damping: 20 }}
      />
    </div>
  );
}

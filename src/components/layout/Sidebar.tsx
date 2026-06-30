"use client";

import React from "react";
import { LayoutDashboard, MessageSquare, ShieldAlert, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassButton from "@/components/ui/GlassButton";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "companion", label: "Empathetic Companion", icon: MessageSquare },
    { id: "guide", label: "Health Guide", icon: ShieldAlert },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-nav bg-ink-text/15 backdrop-blur-xs transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-nav flex w-64 flex-col border-r border-border/70 bg-surface-glass/90 backdrop-blur-xl p-4 transition-transform duration-300 md:translate-x-0 md:bg-surface-glass/35",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/30 md:hidden">
          <span className="font-serif text-sm font-semibold text-ink-soft">Menu</span>
          <GlassButton variant="ghost" className="p-1.5 h-8 w-8" onClick={onClose} aria-label="Close menu">
            <X className="h-4 w-4 text-ink-text" />
          </GlassButton>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 pt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none",
                  isActive
                    ? "bg-sakura-deep/15 text-sakura-deep border-l-[3px] border-sakura-deep font-semibold shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                    : "text-ink-soft hover:bg-surface-glass hover:text-ink-text"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-sakura-deep" : "text-ink-soft")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Branding Footer */}
        <div className="border-t border-border/40 pt-4 text-center mt-auto">
          <p className="text-[10px] font-medium text-ink-soft">さき Sakhi v1.0.0 (Foundation)</p>
          <p className="text-[9px] text-ink-soft/75 mt-0.5">Privacy Focused & Zero-Trust</p>
        </div>
      </aside>
    </>
  );
}

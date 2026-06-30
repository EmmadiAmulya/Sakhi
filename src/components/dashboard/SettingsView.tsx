"use client";

import React, { useState } from "react";
import { Settings, Lock, HardDrive, Bell, User } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore } from "@/lib/store/profile";
import OnboardingForm from "@/components/auth/OnboardingForm";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

export default function SettingsView() {
  const [reminders, setReminders] = useState(true);
  const [anonymity, setAnonymity] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const { profile, logout } = useProfileStore();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full max-w-4xl mx-auto"
    >
      {/* Title */}
      <section className="space-y-1.5">
        <h1 className="font-serif text-3xl font-bold text-ink-text flex items-center gap-2">
          <Settings className="h-6.5 w-6.5 text-ink-soft" />
          Settings
        </h1>
        <p className="text-xs text-ink-soft">
          Manage your personal workspace, data syncing, privacy configurations, and client preferences.
        </p>
      </section>

      {/* Grid of settings options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card (Edit Profile) */}
        <GlassCard className="p-6 space-y-4 md:col-span-2">
          <div className="flex justify-between items-center border-b border-border/30 pb-2">
            <h2 className="text-base font-bold text-ink-text font-serif flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-plum" />
              Personal Profile details
            </h2>
            <GlassButton 
              variant="secondary"
              onClick={() => setIsEditing(!isEditing)} 
              className="py-1 px-3 text-xs"
            >
              {isEditing ? "Cancel" : "Edit Profile Info"}
            </GlassButton>
          </div>
          
          {isEditing ? (
            <OnboardingForm isEditing={true} onSuccess={() => setIsEditing(false)} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-surface-glass/40 p-3.5 rounded-xl border border-border/50">
                <span className="text-[10px] text-ink-soft block uppercase font-semibold">Preferred Name</span>
                <span className="font-bold text-ink-text text-sm">{profile.name || "Amulya"}</span>
              </div>
              <div className="bg-surface-glass/40 p-3.5 rounded-xl border border-border/50">
                <span className="text-[10px] text-ink-soft block uppercase font-semibold">Age Profile</span>
                <span className="font-bold text-ink-text text-sm">{profile.age ? `${profile.age} years` : "Unspecified"}</span>
              </div>
              <div className="bg-surface-glass/40 p-3.5 rounded-xl border border-border/50">
                <span className="text-[10px] text-ink-soft block uppercase font-semibold">Height &amp; Weight</span>
                <span className="font-bold text-ink-text text-sm">
                  {profile.height ? `${profile.height} cm` : "-"} / {profile.weight ? `${profile.weight} kg` : "-"}
                </span>
              </div>
              <div className="bg-surface-glass/40 p-3.5 rounded-xl border border-border/50">
                <span className="text-[10px] text-ink-soft block uppercase font-semibold">Avg Cycle Length</span>
                <span className="font-bold text-ink-text text-sm">{profile.cycleLength} days</span>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Privacy & Zero-Knowledge Security */}
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-base font-bold text-ink-text font-serif flex items-center gap-2 border-b border-border/30 pb-2">
            <Lock className="h-4.5 w-4.5 text-plum" />
            Privacy &amp; Security
          </h2>
          
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-glass/40">
              <div className="flex flex-col">
                <span className="font-semibold text-ink-text">Zero-Knowledge Storage</span>
                <span className="text-[10px] text-ink-soft">Data encrypted locally using workspace credentials.</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-glass/30 transition-all cursor-pointer" onClick={() => setAnonymity(!anonymity)}>
              <div className="flex flex-col">
                <span className="font-semibold text-ink-text">Anonymized Telemetry</span>
                <span className="text-[10px] text-ink-soft">Scrub diagnostic logs and disable health metrics tracking.</span>
              </div>
              <div className={`h-5 w-9 rounded-full transition-colors flex items-center p-0.5 ${anonymity ? "bg-sakura-deep" : "bg-border/60"}`}>
                <div className={`h-4 w-4 bg-white rounded-full transition-transform shadow-sm ${anonymity ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Reminders & Notifications */}
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-base font-bold text-ink-text font-serif flex items-center gap-2 border-b border-border/30 pb-2">
            <Bell className="h-4.5 w-4.5 text-sakura-deep" />
            Reminders &amp; Logs
          </h2>
          
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-glass/30 transition-all cursor-pointer" onClick={() => setReminders(!reminders)}>
              <div className="flex flex-col">
                <span className="font-semibold text-ink-text">Supplement Alarms</span>
                <span className="text-[10px] text-ink-soft">Receive daily alarms matching dosage timing.</span>
              </div>
              <div className={`h-5 w-9 rounded-full transition-colors flex items-center p-0.5 ${reminders ? "bg-sakura-deep" : "bg-border/60"}`}>
                <div className={`h-4 w-4 bg-white rounded-full transition-transform shadow-sm ${reminders ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-glass/40">
              <div className="flex flex-col">
                <span className="font-semibold text-ink-text">Cycle Start Predictor</span>
                <span className="text-[10px] text-ink-soft">Warn 2 days before menstrual cycle onset starts.</span>
              </div>
              <span className="text-[10px] font-bold text-sakura-deep bg-sakura/15 px-2 py-0.5 rounded-full">ENABLED</span>
            </div>
          </div>
        </GlassCard>

        {/* Local Storage Export/Import */}
        <GlassCard className="p-6 space-y-4 md:col-span-2">
          <h2 className="text-base font-bold text-ink-text font-serif flex items-center gap-2 border-b border-border/30 pb-2">
            <HardDrive className="h-4.5 w-4.5 text-ink-soft" />
            Data Operations
          </h2>
          
          <p className="text-xs text-ink-soft leading-relaxed">
            All your cycle history, companion chats, and log diaries are saved locally inside your web browser. You can export the decrypted JSON database, or import it to sync across browsers.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <GlassButton variant="secondary">
              Export Decrypted JSON
            </GlassButton>
            <GlassButton variant="secondary">
              Import Database Backups
            </GlassButton>
            <GlassButton 
              variant="ghost" 
              onClick={logout}
              className="text-red-600 hover:bg-red-50 hover:border-red-100 font-bold"
            >
              Reset Profile &amp; Logout
            </GlassButton>
          </div>
        </GlassCard>

      </div>
    </motion.div>
  );
}

"use client";

import React, { useRef, useState } from "react";
import { Settings, Lock, HardDrive, Bell, User, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore } from "@/lib/store/profile";
import { useRemindersSync, useUpdateReminders } from "@/lib/data/reminders";
import OnboardingForm from "@/components/auth/OnboardingForm";
import { createClient } from "@/lib/supabase/client";
import { db, requireUserId } from "@/lib/data/client";
import { fetchUserDataExport, downloadUserDataExport, importUserDataExport } from "@/lib/data/export";
import { toast } from "@/lib/toast";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

export default function SettingsView() {
  const [isEditing, setIsEditing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = useProfileStore((s) => s.profile);
  const logout = useProfileStore((s) => s.logout);
  const reminders = useProfileStore((s) => s.reminders);

  // Hydrate reminder prefs from Supabase, and persist changes via the hook
  // (optimistic store update + rollback + toast).
  useRemindersSync();
  const updateRemindersMutation = useUpdateReminders();
  const updateReminders = (prefs: Parameters<typeof updateRemindersMutation.mutate>[0]) =>
    updateRemindersMutation.mutate(prefs);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await fetchUserDataExport();
      downloadUserDataExport(data);
      toast.success("Export downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        toast.error("That file is not valid JSON.");
        return;
      }
      if (!window.confirm("This will overwrite/restore your current Sakhi data from the backup. Continue?")) {
        return;
      }
      const { imported, errors } = await importUserDataExport(raw);
      if (errors.length === 0) {
        toast.success(`Import complete: restored ${imported.length} table${imported.length === 1 ? "" : "s"}.`);
      } else {
        toast.error(`Import finished: ${imported.length} table(s) restored, ${errors.length} error(s). ${errors[0]}`);
      }
    } finally {
      setImporting(false);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm("This permanently deletes all your Sakhi data. Continue?")) return;
    setResetting(true);
    try {
      const userId = await requireUserId();
      const userTables = ["chat_sessions", "habits", "supplements", "cycle_logs", "mood_logs", "journal_entries", "reminder_preferences"] as const;
      for (const table of userTables) {
        const { error } = await db().from(table).delete().eq("user_id", userId);
        if (error) throw new Error(`${table}: ${error.message}`);
      }
      const { error: profileError } = await db().from("profiles").delete().eq("id", userId);
      if (profileError) throw new Error(`profiles: ${profileError.message}`);
      const supabase = createClient();
      await supabase.auth.signOut();
      logout();
      toast.success("Account data deleted. You have been signed out.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed. Some data may remain.");
    } finally {
      setResetting(false);
    }
  };

  const handleRequestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
      if (result === "granted") {
        updateReminders({ enabled: true });
        try {
          new Notification("Sakhi — Women's Health Companion", { 
            body: "In-app notifications enabled! You will see alerts while Sakhi is active." 
          });
        } catch (e) {
          console.warn("Failed to trigger local notification check", e);
        }
      } else {
        updateReminders({ enabled: false });
      }
    }
  };

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
                <span className="font-semibold text-ink-text">Row-Level Security</span>
                <span className="text-[10px] text-ink-soft">Your rows are readable only by your signed-in account.</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-glass/40">
              <div className="flex flex-col">
                <span className="font-semibold text-ink-text">Clear on-device cache</span>
                <span className="text-[10px] text-ink-soft">Remove locally cached profile data from this browser.</span>
              </div>
              <GlassButton
                variant="secondary"
                onClick={() => {
                  useProfileStore.persist.clearStorage();
                  toast.success("On-device cache cleared");
                }}
                className="py-1 px-3 text-[10px]"
              >
                Clear Cache
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Reminders & Notifications */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border/30 pb-2">
            <h2 className="text-base font-bold text-ink-text font-serif flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-sakura-deep" />
              Reminders &amp; Alerts
            </h2>
            <button
              onClick={() => updateReminders({ enabled: !reminders.enabled })}
              className={`h-5 w-9 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                reminders.enabled ? "bg-sakura-deep" : "bg-border/60"
              }`}
              aria-label="Toggle reminders globally"
            >
              <div className={`h-4 w-4 bg-white rounded-full transition-transform shadow-sm ${
                reminders.enabled ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            
            {/* Permission flow block */}
            {permissionStatus !== "granted" && (
              <div className="bg-sakura/5 border border-sakura-deep/15 p-3 rounded-xl space-y-2 flex flex-col justify-between">
                <span className="text-[10px] text-ink-soft leading-normal block">
                  Browser notification permissions are not granted. Allow access to test alert updates.
                </span>
                <GlassButton variant="secondary" onClick={handleRequestPermission} className="py-1 px-3 text-[10px] w-fit">
                  Enable Browser Alerts
                </GlassButton>
              </div>
            )}

            {/* Sub-toggles */}
            <div className={`space-y-2 transition-opacity ${reminders.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              
              {/* Upcoming period */}
              <div 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-glass/30 transition-all cursor-pointer"
                onClick={() => updateReminders({ upcomingPeriod: !reminders.upcomingPeriod })}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-ink-text">Period Predictions</span>
                  <span className="text-[10px] text-ink-soft">Receive warnings 2 days before predicted menstruation start.</span>
                </div>
                <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                  reminders.upcomingPeriod ? "bg-sakura-deep border-sakura-deep text-white" : "border-border"
                }`}>
                  {reminders.upcomingPeriod && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Daily logs */}
              <div 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-glass/30 transition-all cursor-pointer"
                onClick={() => updateReminders({ dailyLogNudge: !reminders.dailyLogNudge })}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-ink-text">Daily Logging Nudge</span>
                  <span className="text-[10px] text-ink-soft">Daily alert warning to log symptoms, moods, and energy.</span>
                </div>
                <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                  reminders.dailyLogNudge ? "bg-sakura-deep border-sakura-deep text-white" : "border-border"
                }`}>
                  {reminders.dailyLogNudge && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Supplements alerts */}
              <div 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-glass/30 transition-all cursor-pointer"
                onClick={() => updateReminders({ supplementAlert: !reminders.supplementAlert })}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-ink-text">Supplement Alarm</span>
                  <span className="text-[10px] text-ink-soft">Receive alarms matching daily supplement dosage timers.</span>
                </div>
                <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                  reminders.supplementAlert ? "bg-sakura-deep border-sakura-deep text-white" : "border-border"
                }`}>
                  {reminders.supplementAlert && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Time setter */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-glass/20 border border-border/20">
                <span className="font-semibold text-ink-text">Alert Delivery Time</span>
                <input 
                  type="time" 
                  value={reminders.time} 
                  onChange={(e) => updateReminders({ time: e.target.value })}
                  className="bg-white/40 border border-border rounded px-2 py-0.5 text-xs text-ink-text focus:outline-none"
                />
              </div>

            </div>

            {/* Clear Honest Microcopy Disclaimer */}
            <div className="bg-plum/5 border border-plum/15 rounded-xl p-3 flex items-start gap-2 text-[10px] text-ink-soft leading-normal">
              <AlertCircle className="h-4.5 w-4.5 text-plum flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-bold text-plum">System Limit:</span> Reminders fire while Sakhi is active in your browser tab. Background push alerts are deferred to future database updates.
                {/* TODO: Implement service worker Push Subscription triggers here when migrating to Supabase */}
              </p>
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
            Your data is stored in your private account, protected by row-level security. Export downloads a JSON copy of your data, and import restores a backup.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <GlassButton variant="secondary" type="button" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export Decrypted JSON"}
            </GlassButton>
            <GlassButton variant="secondary" type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? "Importing..." : "Import Database Backups"}
            </GlassButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              aria-label="Choose backup file to import"
              onChange={handleImportFile}
            />
            <GlassButton
              variant="ghost"
              type="button"
              onClick={handleResetAll}
              disabled={resetting}
              className="text-red-600 hover:bg-red-50 hover:border-red-100 font-bold"
            >
              {resetting ? "Deleting..." : "Reset Profile & Logout"}
            </GlassButton>
          </div>
        </GlassCard>

      </div>
    </motion.div>
  );
}

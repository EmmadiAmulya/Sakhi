"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Calendar, Scale, Ruler, User } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useProfileStore } from "@/lib/store/profile";
import { motion } from "framer-motion";

const onboardingSchema = z.object({
  name: z.string().min(1, "Preferred name is required").max(30, "Name must be under 30 characters"),
  age: z.number({ message: "Age is required" }).min(10, "Age must be at least 10").max(100, "Age must be under 100"),
  height: z.number({ message: "Height is required" }).min(50, "Height must be at least 50 cm").max(250, "Height must be under 250 cm"),
  weight: z.number({ message: "Weight is required" }).min(20, "Weight must be at least 20 kg").max(250, "Weight must be under 250 kg"),
  cycleLength: z.number().min(21, "Cycle length must be at least 21 days").max(40, "Cycle length must be under 40 days"),
  lastPeriodDate: z.string().nullable().or(z.literal("")),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
  onSuccess?: () => void;
  isEditing?: boolean;
}

export default function OnboardingForm({ onSuccess, isEditing = false }: OnboardingFormProps) {
  const { profile, setProfile, setOnboarded } = useProfileStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: profile.name || "",
      age: profile.age || undefined,
      height: profile.height || undefined,
      weight: profile.weight || undefined,
      cycleLength: profile.cycleLength || 28,
      lastPeriodDate: profile.lastPeriodDate || "",
    }
  });

  const ageValue = watch("age");

  const onSubmit = async (data: OnboardingValues) => {
    // Save to Zustand store
    setProfile({
      name: data.name,
      age: data.age,
      height: data.height,
      weight: data.weight,
      cycleLength: data.cycleLength,
      lastPeriodDate: data.lastPeriodDate || null,
    });
    
    if (!isEditing) {
      setOnboarded(true);
    }
    
    onSuccess?.();
  };

  return (
    <div className={`flex items-center justify-center ${isEditing ? "py-2" : "min-h-screen px-4 py-8"}`}>
      <motion.div
        initial={isEditing ? {} : { opacity: 0, y: 20 }}
        animate={isEditing ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg z-10"
      >
        <GlassCard className="p-6 md:p-8 space-y-6 rounded-3xl border border-border bg-gradient-to-tr from-surface-white/40 via-surface-white/20 to-surface-white/50 backdrop-blur-xl saturate-[140%] shadow-glass shadow-glass-inset">
          
          {/* Header */}
          {!isEditing && (
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sakura-deep/15 border border-sakura-deep/20 text-sakura-deep">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="font-serif text-xl font-bold text-ink-text mt-3">
                Let&apos;s personalize your space
              </h1>
              <p className="text-xs text-ink-soft max-w-sm mx-auto">
                We use these physiological details to calculate cycle phase durations, countdowns, and wellness suggestions.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Grid of basic details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Preferred Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider pl-1">
                  Preferred Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-ink-soft" />
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="e.g. Amulya"
                    className="w-full bg-surface-glass/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-ink-text focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 shadow-inner"
                  />
                </div>
                {errors.name && (
                  <p className="text-[10px] text-red-500 font-semibold pl-1">{errors.name.message}</p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider pl-1">
                  Age
                </label>
                <input
                  type="number"
                  {...register("age", { valueAsNumber: true })}
                  placeholder="e.g. 24"
                  className="w-full bg-surface-glass/40 border border-border rounded-xl px-4 py-2.5 text-xs text-ink-text focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 shadow-inner"
                />
                {errors.age && (
                  <p className="text-[10px] text-red-500 font-semibold pl-1">{errors.age.message}</p>
                )}
                {/* Minor guidance note */}
                {ageValue && ageValue < 18 && (
                  <p className="text-[9px] text-plum font-medium leading-relaxed pl-1 pt-0.5">
                    Note: For users under 18, guardian guidance is recommended when reviewing health suggestions.
                    {/* TODO: Add family consent link validation check for production gates */}
                  </p>
                )}
              </div>

              {/* Height (cm) */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Height (cm)
                </label>
                <input
                  type="number"
                  {...register("height", { valueAsNumber: true })}
                  placeholder="e.g. 165"
                  className="w-full bg-surface-glass/40 border border-border rounded-xl px-4 py-2.5 text-xs text-ink-text focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 shadow-inner"
                />
                {errors.height && (
                  <p className="text-[10px] text-red-500 font-semibold pl-1">{errors.height.message}</p>
                )}
              </div>

              {/* Weight (kg) */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Scale className="h-3 w-3" /> Weight (kg)
                </label>
                <input
                  type="number"
                  {...register("weight", { valueAsNumber: true })}
                  placeholder="e.g. 58"
                  className="w-full bg-surface-glass/40 border border-border rounded-xl px-4 py-2.5 text-xs text-ink-text focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 shadow-inner"
                />
                {errors.weight && (
                  <p className="text-[10px] text-red-500 font-semibold pl-1">{errors.weight.message}</p>
                )}
              </div>

              {/* Cycle Length (days) */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider pl-1">
                  Avg Cycle Length (days)
                </label>
                <input
                  type="number"
                  {...register("cycleLength", { valueAsNumber: true })}
                  placeholder="e.g. 28"
                  className="w-full bg-surface-glass/40 border border-border rounded-xl px-4 py-2.5 text-xs text-ink-text focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 shadow-inner"
                />
                {errors.cycleLength && (
                  <p className="text-[10px] text-red-500 font-semibold pl-1">{errors.cycleLength.message}</p>
                )}
              </div>

              {/* Last Period Start Date */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Last Period Start Date
                </label>
                <input
                  type="date"
                  {...register("lastPeriodDate")}
                  className="w-full bg-surface-glass/40 border border-border rounded-xl px-4 py-2.5 text-xs text-ink-text focus:outline-none focus:ring-2 focus:ring-sakura-deep/20 shadow-inner"
                />
                {errors.lastPeriodDate && (
                  <p className="text-[10px] text-red-500 font-semibold pl-1">{errors.lastPeriodDate.message}</p>
                )}
              </div>

            </div>

            <GlassButton
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-xs font-semibold mt-4"
            >
              {isSubmitting ? "Saving Profile..." : isEditing ? "Save Profile Changes" : "Complete & Open Sakhi"}
            </GlassButton>

          </form>

        </GlassCard>
      </motion.div>
    </div>
  );
}

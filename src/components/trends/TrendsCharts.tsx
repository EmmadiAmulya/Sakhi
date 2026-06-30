"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { CycleLog } from "@/lib/cycle";
import { useProfileStore } from "@/lib/store/profile";
import { calculateCycle, refineCycleMetrics } from "@/lib/cycle";

interface TrendsChartsProps {
  logs: CycleLog[];
}

export default function TrendsCharts({ logs }: TrendsChartsProps) {
  const profile = useProfileStore((state) => state.profile);

  // Group symptoms
  const symptomCounts: Record<string, number> = {};
  // Group energy levels by cycle phase
  const energyByPhase: Record<string, { sum: number; count: number }> = {
    "Menstrual Phase": { sum: 0, count: 0 },
    "Follicular Phase": { sum: 0, count: 0 },
    "Ovulatory Phase": { sum: 0, count: 0 },
    "Luteal Phase": { sum: 0, count: 0 },
  };

  // Group moods by phase
  const moodByPhase: Record<string, Record<string, number>> = {
    "Menstrual Phase": {},
    "Follicular Phase": {},
    "Ovulatory Phase": {},
    "Luteal Phase": {},
  };

  // Refine metrics
  const { cycleLength: refinedCycleLength, periodLength: refinedPeriodLength } = refineCycleMetrics(
    logs,
    profile.cycleLength,
    5
  );

  logs.forEach((log) => {
    // 1. Symptom aggregation
    if (log.symptoms) {
      log.symptoms.forEach((sym) => {
        symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
      });
    }

    // 2. Compute the exact cycle phase for this date log
    const logDate = new Date(log.date);
    const calc = calculateCycle(profile.lastPeriodDate, refinedCycleLength, refinedPeriodLength, logDate);
    const phaseName = calc.phase.name;

    // Energy aggregate
    if (log.energy !== undefined && energyByPhase[phaseName]) {
      energyByPhase[phaseName].sum += log.energy;
      energyByPhase[phaseName].count += 1;
    }

    // Mood aggregate
    if (log.mood && moodByPhase[phaseName]) {
      moodByPhase[phaseName][log.mood] = (moodByPhase[phaseName][log.mood] || 0) + 1;
    }
  });

  // Format Recharts arrays
  const symptomData = Object.entries(symptomCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 symptoms

  const energyData = Object.entries(energyByPhase).map(([phase, data]) => ({
    phase: phase.replace(" Phase", ""),
    energy: data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 3, // fallback default
  }));

  const moodData = Object.entries(moodByPhase).map(([phase, moods]) => {
    const entry: Record<string, string | number> = { phase: phase.replace(" Phase", "") };
    Object.entries(moods).forEach(([mood, count]) => {
      entry[mood] = count;
    });
    return entry;
  });

  // Extract unique moods for legend coloring
  const uniqueMoods = Array.from(
    new Set(logs.map((l) => l.mood).filter(Boolean) as string[])
  );

  const moodColors = [
    "#d56f96", // sakura pink
    "#8a5a78", // deep plum
    "#a1738f",
    "#c18da9",
    "#f3c1d3",
    "#4e364a",
    "#3a86c8",
    "#a8b3cd",
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Energy Levels Line Chart */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-ink-text uppercase tracking-wider pl-1">
          Average stamina &amp; energy levels by phase
        </h3>
        <div className="h-64 w-full bg-surface-glass/20 border border-border/60 p-4 rounded-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="phase" stroke="#8a5a78" fontSize={9} tickLine={false} />
              <YAxis stroke="#8a5a78" fontSize={9} domain={[1, 5]} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(255,255,255,0.9)", 
                  border: "1px solid rgba(138, 90, 120, 0.15)",
                  borderRadius: "12px",
                  fontSize: "10px"
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="energy" 
                stroke="#d56f96" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Symptom Frequency Bar Chart */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-ink-text uppercase tracking-wider pl-1">
          Top Logged Symptoms frequency
        </h3>
        <div className="h-64 w-full bg-surface-glass/20 border border-border/60 p-4 rounded-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={symptomData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" stroke="#8a5a78" fontSize={9} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#8a5a78" fontSize={9} width={90} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(255,255,255,0.9)", 
                  border: "1px solid rgba(138, 90, 120, 0.15)",
                  borderRadius: "12px",
                  fontSize: "10px"
                }} 
              />
              <Bar dataKey="count" fill="#8a5a78" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Mood Distribution Stacked Bar Chart */}
      {uniqueMoods.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-ink-text uppercase tracking-wider pl-1">
            Mood Distribution across cycle phases
          </h3>
          <div className="h-64 w-full bg-surface-glass/20 border border-border/60 p-4 rounded-2xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="phase" stroke="#8a5a78" fontSize={9} tickLine={false} />
                <YAxis stroke="#8a5a78" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255,255,255,0.9)", 
                    border: "1px solid rgba(138, 90, 120, 0.15)",
                    borderRadius: "12px",
                    fontSize: "10px"
                  }} 
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "8px", paddingTop: "5px" }} />
                {uniqueMoods.slice(0, 8).map((mood, idx) => (
                  <Bar 
                    key={mood} 
                    dataKey={mood} 
                    stackId="a" 
                    fill={moodColors[idx % moodColors.length]} 
                    barSize={16} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}

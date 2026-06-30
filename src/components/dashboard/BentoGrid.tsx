"use client";

import React from "react";
import { cn } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";
import { ArrowUpRight } from "lucide-react";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full", className)}>
      {children}
    </div>
  );
}

interface BentoCardProps extends React.ComponentPropsWithoutRef<typeof GlassCard> {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3;
}

export function BentoCard({ children, className, span = 1, ...props }: BentoCardProps) {
  const spanClasses = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-3",
  };

  return (
    <GlassCard
      className={cn(
        spanClasses[span],
        "p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 rounded-3xl min-h-[160px]",
        className
      )}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

interface NavCardProps extends Omit<BentoCardProps, "onClick" | "children"> {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  stat?: string;
  description?: string;
}

export function NavCard({
  label,
  onClick,
  icon,
  stat,
  description,
  className,
  ...props
}: NavCardProps) {
  return (
    <BentoCard
      onClick={onClick}
      className={cn(
        "cursor-pointer group hover:bg-surface-white/60 hover:border-sakura-deep/30 shadow-glass-inset shadow-glass",
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-start w-full">
        {/* Icon wrapper */}
        <div className="h-10 w-10 rounded-xl bg-sakura-deep/10 border border-sakura-deep/15 flex items-center justify-center text-sakura-deep group-hover:bg-sakura-deep/20 transition-colors">
          {icon}
        </div>
        
        {/* Hover arrow indicator */}
        <div className="h-6 w-6 rounded-full bg-border/20 border border-border/10 flex items-center justify-center text-ink-soft opacity-60 group-hover:opacity-100 group-hover:bg-sakura/10 group-hover:text-plum transition-all">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="space-y-1.5 mt-6 w-full">
        <div className="flex items-baseline justify-between w-full">
          <h3 className="font-serif text-sm font-bold text-ink-text leading-none">{label}</h3>
          {stat && (
            <span className="text-[10px] font-bold text-plum bg-sakura/15 px-2 py-0.5 rounded-full select-none">
              {stat}
            </span>
          )}
        </div>
        
        {description && (
          <p className="text-[11px] text-ink-soft leading-relaxed pr-2">
            {description}
          </p>
        )}
      </div>
    </BentoCard>
  );
}

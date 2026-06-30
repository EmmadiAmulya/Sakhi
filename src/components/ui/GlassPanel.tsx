import React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GlassPanel({ children, className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-gradient-to-tr from-surface-white/40 via-surface-white/20 to-surface-white/55 backdrop-blur-xl saturate-[140%]",
        "shadow-glass shadow-glass-inset transition-all duration-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GlassPanel({ children, className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-surface-glass backdrop-blur-xl",
        "shadow-glass shadow-glass-inset transition-all duration-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

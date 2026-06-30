"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { itemVariants } from "@/lib/motion";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  hoverScale?: boolean;
  animateEntrance?: boolean;
  className?: string;
}

export default function GlassCard({
  children,
  className,
  hoverScale = true,
  animateEntrance = true,
  ...props
}: GlassCardProps) {
  const cardClassName = cn(
    "rounded-2xl border border-border/80 bg-gradient-to-tr from-surface-white/35 via-surface-white/15 to-surface-white/50 backdrop-blur-xl saturate-[140%]",
    "shadow-glass shadow-glass-inset liquid-glass-sheen transition-all duration-300",
    hoverScale && "hover:scale-[1.012] hover:shadow-glass-glow hover:bg-gradient-to-tr hover:from-surface-white/50 hover:via-surface-white/25 hover:to-surface-white/60",
    className
  );

  if (animateEntrance) {
    return (
      <motion.div
        variants={itemVariants}
        className={cardClassName}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cardClassName}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
}

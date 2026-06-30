"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { springTransition } from "@/lib/motion";

interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}

export default function GlassButton({
  children,
  className,
  variant = "secondary",
  ...props
}: GlassButtonProps) {
  const baseStyles = 
    "relative px-5 py-2.5 rounded-xl text-sm font-medium tracking-wide " +
    "transition-colors duration-300 shadow-glass-button-inset border select-none " +
    "flex items-center justify-center gap-2 cursor-pointer liquid-glass-sheen overflow-hidden";
  
  const variants = {
    primary: "bg-sakura-deep/90 text-surface-white border-sakura-deep/30 shadow-md hover:bg-sakura-deep",
    secondary: "bg-surface-glass/85 border-border text-ink-text backdrop-blur-md hover:bg-surface-white/60",
    ghost: "bg-transparent border-transparent text-ink-soft hover:bg-surface-glass/40 hover:border-border/30",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.025, y: -0.5 }}
      whileTap={{ scale: 0.975 }}
      transition={springTransition}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

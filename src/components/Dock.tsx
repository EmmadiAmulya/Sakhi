"use client";

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from "framer-motion";
import React, {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export type DockItemData = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

/*
  Snappy, near-critical spring.
  Critical damping for mass 0.1 @ stiffness 600 ≈ 2*sqrt(600*0.1) ≈ 15.5,
  so damping 17 settles fast with no wobble and no lag.
*/
const DEFAULT_SPRING: SpringOptions = { mass: 0.1, stiffness: 600, damping: 17 };

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  label: string;
  shouldReduceMotion?: boolean;
};

function DockItem({
  children,
  className = "",
  onClick,
  isActive = false,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  shouldReduceMotion = false,
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const isHovered = useMotionValue(0);

  // Distance from cursor to this item's TRUE horizontal center.
  // Using the full rect center (not left + base/2) keeps the value stable
  // under center-origin scaling, which prevents feedback jitter.
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect();
    const center = rect ? rect.x + rect.width / 2 : 0;
    return val - center;
  });

  // GPU transform scale (no layout reflow).
  const maxScale = magnification / baseItemSize;
  const targetScale = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [1, maxScale, 1],
    { clamp: true }
  );

  const scale = useSpring(targetScale, spring);

  return (
    <motion.button
      ref={ref}
      style={
        shouldReduceMotion
          ? { scale: 1, width: baseItemSize, height: baseItemSize }
          : {
              scale,
              width: baseItemSize,
              height: baseItemSize,
              willChange: "transform", // dedicated GPU layer
            }
      }
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        // NOTE: transition-colors ONLY. Never transition-all here — a CSS
        // transition on `transform` fights the Framer spring and causes lag.
        "relative inline-flex items-center justify-center rounded-xl select-none cursor-pointer border origin-bottom shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep/40",
        isActive
          ? "bg-sakura-deep/15 text-sakura-deep border-sakura-deep/30 shadow-inner"
          : "bg-surface-glass/70 text-ink-soft border-border hover:bg-surface-white/60 hover:text-ink-text",
        className
      )}
    >
      <div className="flex items-center justify-center">
        {Children.map(children, (child) =>
          React.isValidElement(child)
            ? cloneElement(
                child as React.ReactElement<{ isHovered?: MotionValue<number> }>,
                { isHovered }
              )
            : child
        )}
      </div>

      {isActive && (
        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sakura-deep" />
      )}
    </motion.button>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = "", isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute -top-7 left-1/2 w-fit whitespace-pre rounded-md border border-border/80 bg-surface-glass backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-ink-text shadow-sm pointer-events-none z-50",
            className
          )}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = "" }: DockIconProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {children}
    </div>
  );
}

export default function Dock({
  items,
  className = "",
  spring = DEFAULT_SPRING,
  magnification = 58,
  distance = 140,
  panelHeight = 60,
  dockHeight = 256,
  baseItemSize = 40,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const [shouldReduceMotion, setShouldReduceMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Only reserve a SMALL amount of extra height for the magnified row.
  // The old code expanded to dockHeight (256px), which caused a big layout
  // jump on hover. We cap it just above the magnified item size.
  const maxHeight = useMemo(
    () => Math.min(dockHeight, magnification + 16),
    [dockHeight, magnification]
  );

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={shouldReduceMotion ? { height: panelHeight } : { height }}
      className="mx-2 flex max-w-full items-center relative overflow-visible"
    >
      <motion.div
        onMouseMove={({ clientX }) => {
          if (shouldReduceMotion) return;
          isHovered.set(1);
          mouseX.set(clientX); // viewport coords — matches getBoundingClientRect
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end w-fit gap-3.5 rounded-2xl border border-border/80 bg-surface-glass backdrop-blur-xl saturate-[140%] px-3.5 shadow-glass shadow-glass-inset",
          className
        )}
        style={{
          height: panelHeight,
          paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
        }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            isActive={item.isActive}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            label={item.label}
            shouldReduceMotion={shouldReduceMotion}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
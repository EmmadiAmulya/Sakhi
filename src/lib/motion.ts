import { Variants } from "framer-motion";

// Custom ease curve (ease-out-soft) matching Apple/premium designs
export const easeOutSoft = [0.16, 1, 0.3, 1] as const;

// Premium spring configuration for tactile, physical-feeling interactions
export const springTransition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
} as const;

// Reusable transition configuration using ease-out-soft
export const softTransition = {
  ease: easeOutSoft,
  duration: 0.6,
};

// Page transitions for smooth layout changes
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ease: easeOutSoft,
      duration: 0.6,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      ease: easeOutSoft,
      duration: 0.4,
    },
  },
};

// Card enter animations for smooth visual cascades
export const itemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
    },
  },
};

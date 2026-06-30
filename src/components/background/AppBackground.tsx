import React from "react";

export default function AppBackground() {
  return (
    <div className="fixed inset-0 -z-bg select-none pointer-events-none overflow-hidden bg-surface-white">
      {/* Responsive fixed background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000
          [background-image:url('/assets/sakura-bg-pc.jpg')]
          max-md:[background-image:url('/assets/sakura-bg-mob.png')]"
        aria-hidden="true"
      />
      
      {/* White scrim layer for WCAG 2.1 AA text contrast */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-surface-white/30 via-surface-white/50 to-surface-white/75" 
        aria-hidden="true"
      />
      
      {/* Subtle radial scrim overlay focusing negative space in the center/right */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,252,254,0.3)_0%,rgba(251,252,254,0.6)_100%)]" 
        aria-hidden="true"
      />
    </div>
  );
}

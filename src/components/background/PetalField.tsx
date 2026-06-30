"use client";

import React, { useEffect, useRef } from "react";

class Petal {
  x: number = 0;
  y: number = 0;
  w: number = 0;
  h: number = 0;
  opacity: number = 0;
  flip: number = 0;
  flipSpeed: number = 0;
  xSpeed: number = 0;
  ySpeed: number = 0;
  spin: number = 0;
  angle: number = 0;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.reset(canvasWidth, canvasHeight, true);
  }

  reset(canvasWidth: number, canvasHeight: number, initial = false) {
    this.x = initial ? Math.random() * canvasWidth : -20;
    this.y = initial ? Math.random() * canvasHeight : Math.random() * canvasHeight * -0.5 - 20;
    this.w = Math.random() * 8 + 6; // size 6px to 14px
    this.h = this.w * (Math.random() * 0.4 + 0.8);
    this.opacity = Math.random() * 0.4 + 0.25; // opacity 0.25 to 0.65 for elegance
    this.flip = Math.random() * Math.PI;
    this.flipSpeed = Math.random() * 0.03 + 0.01;
    this.xSpeed = Math.random() * 1.2 + 0.6; // soft diagonal drift right
    this.ySpeed = Math.random() * 0.8 + 0.5; // slow drift down
    this.spin = Math.random() * 0.015 - 0.0075;
    this.angle = Math.random() * Math.PI * 2;
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    this.angle += this.spin;
    this.flip += this.flipSpeed;

    // Reset if it goes off bottom or right screen
    if (this.y > canvasHeight + 20 || this.x > canvasWidth + 20) {
      this.reset(canvasWidth, canvasHeight);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(Math.sin(this.flip), 1);

    // Draw organic sakura petal shape
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Draw left curve
    ctx.bezierCurveTo(-this.w / 2, -this.h / 3, -this.w / 1.5, -this.h * 0.8, 0, -this.h);
    // Draw right curve
    ctx.bezierCurveTo(this.w / 1.5, -this.h * 0.8, this.w / 2, -this.h / 3, 0, 0);
    
    // Solid fill using sakura base color
    ctx.fillStyle = `rgba(232, 155, 182, ${this.opacity})`;
    ctx.fill();

    // Subtle dark-pink shadow outline
    ctx.strokeStyle = `rgba(213, 111, 150, ${this.opacity * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }
}

export default function PetalField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) {
      return; // Do not animate at all
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const petals: Petal[] = [];
    const maxPetals = 45; // Sparse and elegant

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-initialize petals if none exist
      if (petals.length === 0) {
        for (let i = 0; i < maxPetals; i++) {
          petals.push(new Petal(canvas.width, canvas.height));
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < petals.length; i++) {
        const petal = petals[i];
        petal.update(canvas.width, canvas.height);
        petal.draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-petals pointer-events-none select-none overflow-hidden"
      style={{ mixBlendMode: "normal" }}
    />
  );
}

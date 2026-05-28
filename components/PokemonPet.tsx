"use client";

import React, { useEffect, useRef } from "react";

interface PokemonPetProps {
  id: number;
  name: string;
}

export function PokemonPet({ id, name }: PokemonPetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;

    // Initial random position within safe bounds
    let currentX = Math.random() * (window.innerWidth - 100);
    let currentY = Math.random() * (window.innerHeight - 100);
    
    containerRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
    containerRef.current.style.opacity = "1";

    let dx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
    let dy = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
    let currentDir = dx > 0 ? "right" : "left";

    if (currentDir === "right") {
      imgRef.current.style.transform = "scaleX(-1)";
    } else {
      imgRef.current.style.transform = "scaleX(1)";
    }

    const animate = () => {
      currentX += dx;
      currentY += dy;

      if (currentX <= 0) {
        currentX = 0;
        dx = Math.abs(dx);
        currentDir = "right";
      } else if (currentX >= window.innerWidth - 64) {
        currentX = window.innerWidth - 64;
        dx = -Math.abs(dx);
        currentDir = "left";
      }

      if (currentY <= 0) {
        currentY = 0;
        dy = Math.abs(dy);
      } else if (currentY >= window.innerHeight - 64) {
        currentY = window.innerHeight - 64;
        dy = -Math.abs(dy);
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }

      // Randomly change direction sometimes (1% chance per tick)
      if (Math.random() < 0.01) {
        dx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
        dy = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
        if (dx > 0 && currentDir !== "right") {
          currentDir = "right";
        } else if (dx < 0 && currentDir !== "left") {
          currentDir = "left";
        }
      }
      
      if (imgRef.current) {
        if (currentDir === "right") {
          imgRef.current.style.transform = "scaleX(-1)";
        } else {
          imgRef.current.style.transform = "scaleX(1)";
        }
      }
    };

    // 50ms interval for smooth ~20fps movement (gif animations are around this speed)
    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] pointer-events-none opacity-0"
      style={{
        width: "64px",
        height: "64px",
        transition: "transform 0.05s linear", // Smooth interpolation between ticks
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`}
        alt={name}
        className="w-full h-full object-contain transition-transform duration-200"
        style={{
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

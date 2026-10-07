import React, { useEffect, useRef } from 'react';
import { VisualWeatherEffect } from '../types/weather';

interface Props {
  effectMode: VisualWeatherEffect;
  isHazy: boolean;
  isRaining: boolean;
  isStormy: boolean;
  psiLevel?: number;
}

export const WeatherBackgroundEffects: React.FC<Props> = ({
  effectMode,
  isHazy,
  isRaining,
  isStormy,
  psiLevel = 45,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine active visual state
  const activeEffect: 'haze' | 'rain' | 'storm' | 'clear' | 'none' = React.useMemo(() => {
    if (effectMode === 'off') return 'none';
    if (effectMode === 'haze') return 'haze';
    if (effectMode === 'rain') return 'rain';
    if (effectMode === 'heavy-rain' || effectMode === 'thunderstorm') return 'storm';
    if (effectMode === 'clear') return 'clear';

    // Auto mode based on real data
    if (isHazy) return 'haze';
    if (isStormy) return 'storm';
    if (isRaining) return 'rain';
    return 'clear';
  }, [effectMode, isHazy, isRaining, isStormy]);

  // Rain / Storm Canvas Animation
  useEffect(() => {
    if (activeEffect !== 'rain' && activeEffect !== 'storm') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const dropCount = activeEffect === 'storm' ? 180 : 80;
    interface Drop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }

    const drops: Drop[] = [];
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 12 + Math.random() * (activeEffect === 'storm' ? 22 : 14),
        speed: activeEffect === 'storm' ? 18 + Math.random() * 10 : 9 + Math.random() * 6,
        opacity: 0.15 + Math.random() * 0.35,
      });
    }

    let lightningTimer = 0;
    let isFlashing = false;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Thunderstorm lightning flash simulation
      if (activeEffect === 'storm') {
        lightningTimer++;
        if (lightningTimer > 180 && Math.random() < 0.015) {
          isFlashing = true;
          lightningTimer = 0;
          setTimeout(() => (isFlashing = false), 80 + Math.random() * 90);
        }
        if (isFlashing) {
          ctx.fillStyle = 'rgba(219, 234, 254, 0.12)';
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Draw raindrops
      ctx.strokeStyle = activeEffect === 'storm' ? 'rgba(186, 230, 253, 0.65)' : 'rgba(147, 197, 253, 0.4)';
      ctx.lineWidth = activeEffect === 'storm' ? 1.6 : 1.2;
      ctx.beginPath();

      const slant = activeEffect === 'storm' ? 4 : 2;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - slant, d.y + d.length);

        d.y += d.speed;
        d.x -= slant * 0.4;

        if (d.y > height) {
          d.y = -d.length;
          d.x = Math.random() * (width + 100);
        }
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeEffect]);

  // Floating Haze Particulate Canvas Animation
  useEffect(() => {
    if (activeEffect !== 'haze') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 70;
    interface DustParticle {
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      opacity: number;
      alphaPhase: number;
    }

    const particles: DustParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.5 + Math.random() * 3.5,
        speedX: 0.15 + Math.random() * 0.4,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: 0.1 + Math.random() * 0.25,
        alphaPhase: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.alphaPhase += 0.02;
        const dynamicAlpha = p.opacity + Math.sin(p.alphaPhase) * 0.08;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
        grad.addColorStop(0, `rgba(217, 180, 130, ${Math.max(0, dynamicAlpha)})`);
        grad.addColorStop(1, 'rgba(217, 180, 130, 0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x > width + 20) p.x = -20;
        if (p.y > height + 20) p.y = -20;
        if (p.y < -20) p.y = height + 20;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeEffect]);

  if (activeEffect === 'none') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000 ease-in-out">
      {/* 1. Hazy / Foggy Atmospheric Background Effect */}
      {activeEffect === 'haze' && (
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          {/* Base ambient smoky haze tint */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-slate-900/60 to-amber-950/20 mix-blend-multiply"
            style={{ backdropFilter: 'blur(3px)' }}
          />

          {/* Drifting Dense Fog Bank 1 (Left to Right) */}
          <div
            className="absolute -top-[20%] -left-[30%] w-[160%] h-[140%] rounded-full opacity-40 blur-[90px] animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(217,160,90,0.28) 0%, rgba(140,120,95,0.18) 45%, transparent 75%)',
              animationDuration: '14s',
            }}
          />

          {/* Drifting Fog Bank 2 (Parallax Counter-Drift) */}
          <div
            className="absolute -bottom-[20%] -right-[20%] w-[140%] h-[120%] rounded-full opacity-35 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(200,150,80,0.24) 0%, rgba(100,116,139,0.2) 50%, transparent 80%)',
            }}
          />

          {/* Low Horizon Fog Strip across the screen */}
          <div
            className="absolute bottom-0 left-0 right-0 h-96 opacity-60 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(180,140,80,0.3) 0%, rgba(120,110,95,0.15) 50%, transparent 100%)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Visual indicator watermark badge */}
          <div className="absolute top-20 right-6 flex items-center gap-2 text-xs font-mono text-amber-300/80 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>FOGGY / HAZE ATMOSPHERE (PSI {psiLevel})</span>
          </div>
        </div>
      )}

      {/* 2. Stormy Night Thundercloud Vignette */}
      {activeEffect === 'storm' && (
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-slate-950/70 to-cyan-950/30" />
          <div className="absolute top-20 right-6 flex items-center gap-2 text-xs font-mono text-sky-300/80 bg-slate-950/60 border border-sky-500/30 px-3 py-1.5 rounded backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>THUNDERY SHOWER ATMOSPHERE</span>
          </div>
        </div>
      )}

      {/* 3. Rain Soft Blue Atmosphere */}
      {activeEffect === 'rain' && (
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-slate-950/50 to-slate-950/70" />
          <div className="absolute top-20 right-6 flex items-center gap-2 text-xs font-mono text-blue-300/80 bg-slate-950/60 border border-blue-500/30 px-3 py-1.5 rounded backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>RAIN SHOWER OVERLAY ACTIVE</span>
          </div>
        </div>
      )}

      {/* 4. Canvas for Raindrops / Dust Particulate */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

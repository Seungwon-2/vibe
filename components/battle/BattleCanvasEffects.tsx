'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type ActionState = {
  stepIndex: number;
  attackerSide: 'player' | 'enemy' | null;
  moveType: string | null;
  animState: 'idle' | 'attacking' | 'hit' | 'evade';
  isCritical: boolean;
};

type Props = {
  actionState: ActionState;
  playerRef: RefObject<HTMLElement | null>;
  enemyRef: RefObject<HTMLElement | null>;
  ambientType: typeof AMBIENT_TYPES[number];
};

export const AMBIENT_TYPES = ['cherryBlossom', 'snow', 'rain', 'embers', 'shootingStars', 'magicSparkles'] as const;

// ──────────────── 파티클 설정 ────────────────
const TYPE_COLORS: Record<string, string[]> = {
  fire: ['#ff4500', '#ff8c00', '#ffd700'],
  water: ['#00bfff', '#1e90ff', '#4169e1'],
  grass: ['#32cd32', '#228b22', '#00ff00'],
  electric: ['#ffff00', '#ffd700', '#ffffe0'],
  psychic: ['#ff69b4', '#da70d6', '#9370db'],
  ice: ['#e0ffff', '#afeeee', '#87cefa'],
  dragon: ['#8a2be2', '#4b0082', '#9400d3'],
  dark: ['#2f4f4f', '#696969', '#000000'],
  ghost: ['#483d8b', '#6a5acd', '#7b68ee'],
  fairy: ['#ffb6c1', '#ffc0cb', '#fff0f5'],
  poison: ['#800080', '#9932cc', '#ba55d3'],
  ground: ['#d2b48c', '#deb887', '#cd853f'],
  rock: ['#8b4513', '#a0522d', '#cd853f'],
  flying: ['#87ceeb', '#add8e6', '#e0ffff'],
  bug: ['#9acd32', '#6b8e23', '#556b2f'],
  fighting: ['#b22222', '#dc143c', '#ff0000'],
  steel: ['#708090', '#778899', '#c0c0c0'],
  normal: ['#a9a9a9', '#d3d3d3', '#ffffff'],
};

class Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
  type: 'burst' | 'projectile' | 'text' | 'trail' | 'shockwave' | 'flash' | 'ambient' | 'shatter';
  text?: string;
  rotation: number = 0;
  vRotation: number = 0;
  targetX?: number;
  targetY?: number;
  ambientType?: string; // 앰비언트 파티클 전용 타입
  moveType?: string | null; // 형태를 결정짓는 속성

  constructor(opts: Partial<Particle>) {
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.maxLife = opts.maxLife || 1;
    this.life = this.maxLife;
    this.color = opts.color || '#fff';
    this.size = opts.size || 5;
    this.type = opts.type || 'burst';
    this.text = opts.text;
    this.targetX = opts.targetX;
    this.targetY = opts.targetY;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRotation = (Math.random() - 0.5) * 0.2;
    this.ambientType = opts.ambientType;
    this.moveType = opts.moveType;
  }

  update(dt: number) {
    this.life -= dt;
    if (this.type === 'projectile' && this.targetX !== undefined && this.targetY !== undefined) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        this.vx = (dx / dist) * 1500;
        this.vy = (dy / dist) * 1500;
      }
    } else if (this.type === 'shockwave') {
      this.size += 800 * dt;
    } else if (this.type === 'text') {
      this.vy -= 150 * dt;
      this.vx *= 0.9;
    } else if (this.type === 'ambient') {
      // 앰비언트 종류에 따른 부드러운 움직임
      if (this.ambientType === 'snow' || this.ambientType === 'rain') {
        // 일정한 중력
      } else if (this.ambientType === 'cherryBlossom') {
        this.vx += Math.sin(this.life * 5) * 20 * dt; // 지그재그 나풀거림
        this.rotation += 2 * dt;
      } else if (this.ambientType === 'embers') {
        this.vx += (Math.random() - 0.5) * 50 * dt; // 불규칙한 떠오름
      }
    } else if (this.type === 'shatter') {
      this.vy += 800 * dt; // 강한 중력
    } else if (this.type !== 'flash') {
      this.vx *= 0.93;
      this.vy *= 0.93;
      if (this.type === 'burst') this.size *= 0.94;
    }
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.type !== 'ambient') {
      this.rotation += this.vRotation;
    }
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    ctx.save();
    const progress = this.life / this.maxLife;
    
    if (this.type === 'flash') {
      ctx.globalAlpha = Math.max(0, progress * 0.5);
      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
      return;
    }

    if (this.type === 'ambient') {
      // 앰비언트는 투명도가 서서히 변함
      const fadeProgress = this.life < 1 ? this.life : (this.maxLife - this.life < 1 ? (this.maxLife - this.life) : 1);
      ctx.globalAlpha = Math.max(0, Math.min(1, fadeProgress));
    } else {
      ctx.globalAlpha = Math.max(0, progress);
    }
    
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.type === 'text' && this.text) {
      const scale = 1 + (1 - progress) * 0.5;
      ctx.scale(scale, scale);
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#000';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 6;
      ctx.strokeText(this.text, 0, 0);
      
      const gradient = ctx.createLinearGradient(0, -20, 0, 20);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.5, this.color);
      gradient.addColorStop(1, '#800000');
      ctx.fillStyle = gradient;
      ctx.fillText(this.text, 0, 0);
    } else if (this.type === 'shockwave') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 15 * progress;
      ctx.stroke();
    } else if (this.type === 'projectile') {
      ctx.scale(1.5, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 40;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.5;
      ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'shatter') {
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size * 0.8, this.size);
      ctx.lineTo(-this.size * 0.8, this.size);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
    } else if (this.type === 'ambient') {
      ctx.beginPath();
      if (this.ambientType === 'cherryBlossom') {
        ctx.fillStyle = this.color;
        ctx.scale(1.5, 0.8);
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.ambientType === 'rain' || this.ambientType === 'shootingStars') {
        ctx.fillStyle = this.color;
        ctx.scale(0.2, 2.0);
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = this.color;
        ctx.arc(0, 0, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = this.color;
        ctx.fill();
      }
    } else {
      // type === 'burst' or 'trail'
      ctx.beginPath();
      ctx.fillStyle = this.color;

      if (this.moveType === 'water') {
        // 물방울 모양
        ctx.moveTo(0, -this.size);
        ctx.quadraticCurveTo(this.size, this.size*0.5, 0, this.size);
        ctx.quadraticCurveTo(-this.size, this.size*0.5, 0, -this.size);
      } else if (this.moveType === 'electric') {
        // 번개/스파크 모양
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size*0.5, 0);
        ctx.lineTo(-this.size*0.5, this.size*0.5);
        ctx.lineTo(0, this.size);
      } else if (this.moveType === 'grass') {
        // 나뭇잎 모양
        ctx.scale(1.5, 0.5);
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      } else if (this.moveType === 'rock' || this.moveType === 'ground') {
        // 다각형 바위 파편
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(this.size*0.5, this.size);
        ctx.lineTo(-this.size*0.5, this.size);
        ctx.lineTo(-this.size, 0);
      } else if (this.moveType === 'ice') {
        // 육각형 눈결정 파편
        for(let i=0; i<6; i++) {
          ctx.lineTo(Math.cos(i*Math.PI/3)*this.size, Math.sin(i*Math.PI/3)*this.size);
        }
      } else {
        // 기본 원형(불, 노말 등)
        ctx.arc(0, 0, Math.max(0, this.size), 0, Math.PI * 2);
      }

      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      ctx.fill();
    }
    
    ctx.restore();
  }
}

// ──────────────── 컴포넌트 ────────────────

export function BattleCanvasEffects({ actionState, playerRef, enemyRef, ambientType }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastStateRef = useRef<ActionState['animState']>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height); 

      // ── 앰비언트 파티클 생성 ──
      if (Math.random() < 0.1) {
        let x = Math.random() * canvas.width;
        let y = 0;
        let vx = 0;
        let vy = 0;
        let color = '#fff';
        let size = 3;
        let maxLife = 5;

        switch (ambientType) {
          case 'cherryBlossom':
            x = Math.random() * canvas.width;
            y = -10;
            vx = 30 + Math.random() * 20;
            vy = 30 + Math.random() * 30;
            color = '#ffb7c5';
            size = 3 + Math.random() * 2;
            break;
          case 'snow':
            x = Math.random() * canvas.width;
            y = -10;
            vx = (Math.random() - 0.5) * 20;
            vy = 20 + Math.random() * 20;
            color = '#ffffff';
            size = 2 + Math.random() * 2;
            break;
          case 'rain':
            x = Math.random() * canvas.width;
            y = -20;
            vx = 20;
            vy = 400 + Math.random() * 200;
            color = '#aaccff';
            size = 5 + Math.random() * 5;
            maxLife = 2;
            break;
          case 'embers':
            x = Math.random() * canvas.width;
            y = canvas.height + 10;
            vx = (Math.random() - 0.5) * 30;
            vy = -50 - Math.random() * 50;
            color = Math.random() > 0.5 ? '#ff4500' : '#ffd700';
            size = 1 + Math.random() * 3;
            break;
          case 'shootingStars':
            if (Math.random() > 0.1) break; // 별똥별은 가끔씩
            x = Math.random() * canvas.width * 1.5;
            y = -50;
            vx = -500 - Math.random() * 500;
            vy = 500 + Math.random() * 500;
            color = '#ffffdd';
            size = 4 + Math.random() * 4;
            maxLife = 1;
            break;
          case 'magicSparkles':
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
            vx = (Math.random() - 0.5) * 20;
            vy = -10 - Math.random() * 20;
            color = ['#ff69b4', '#00ffff', '#ffff00'][Math.floor(Math.random() * 3)];
            size = 1 + Math.random() * 2;
            break;
        }

        particlesRef.current.push(new Particle({
          x, y, vx, vy, color, size, maxLife, type: 'ambient', ambientType
        }));
      }

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(dt);
        p.draw(ctx, canvas.width, canvas.height);
        
        if (p.type === 'projectile' && Math.random() > 0.1) {
          particles.push(new Particle({
            x: p.x + (Math.random() - 0.5) * 20,
            y: p.y + (Math.random() - 0.5) * 20,
            vx: -p.vx * 0.2 + (Math.random() - 0.5) * 100,
            vy: -p.vy * 0.2 + (Math.random() - 0.5) * 100,
            maxLife: Math.random() * 0.4 + 0.2,
            size: p.size * (Math.random() * 0.5 + 0.5),
            color: p.color,
            type: 'trail'
          }));
        }

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [ambientType]);

  useEffect(() => {
    if (actionState.animState === lastStateRef.current) return;
    lastStateRef.current = actionState.animState;

    const canvas = canvasRef.current;
    if (!canvas || !playerRef.current || !enemyRef.current) return;

    const canvasRect = canvas.getBoundingClientRect();
    const playerRect = playerRef.current.getBoundingClientRect();
    const enemyRect = enemyRef.current.getBoundingClientRect();

    // 캔버스 내부 좌표로 변환
    const getCenter = (rect: DOMRect) => ({
      x: (rect.left + rect.width / 2) - canvasRect.left,
      y: (rect.top + rect.height / 2) - canvasRect.top,
    });

    const playerCenter = getCenter(playerRect);
    const enemyCenter = getCenter(enemyRect);

    const isPlayerAttacking = actionState.attackerSide === 'player';
    const sourceCenter = isPlayerAttacking ? playerCenter : enemyCenter;
    const targetCenter = isPlayerAttacking ? enemyCenter : playerCenter;

    const colors = TYPE_COLORS[actionState.moveType || 'normal'] || TYPE_COLORS['normal'];
    const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

    if (actionState.animState === 'attacking') {
      particlesRef.current.push(new Particle({
        x: sourceCenter.x,
        y: sourceCenter.y,
        targetX: targetCenter.x,
        targetY: targetCenter.y,
        maxLife: 0.3,
        size: 25,
        color: randomColor(),
        type: 'projectile',
        moveType: actionState.moveType
      }));
    } else if (actionState.animState === 'hit') {
      particlesRef.current.push(new Particle({ maxLife: 0.2, color: '#ffffff', type: 'flash' }));
      particlesRef.current.push(new Particle({
        x: targetCenter.x, y: targetCenter.y,
        maxLife: 0.4, size: 10, color: randomColor(), type: 'shockwave'
      }));

      for (let i = 0; i < 150; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() > 0.8 ? Math.random() * 800 + 400 : Math.random() * 400 + 100;
        particlesRef.current.push(new Particle({
          x: targetCenter.x + (Math.random() - 0.5) * 60,
          y: targetCenter.y + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          maxLife: Math.random() * 0.8 + 0.4,
          size: Math.random() * 12 + 4,
          color: randomColor(),
          type: 'burst',
          moveType: actionState.moveType
        }));
      }

      if (actionState.isCritical) {
        particlesRef.current.push(new Particle({
          x: targetCenter.x,
          y: targetCenter.y - 60,
          vx: (Math.random() - 0.5) * 150,
          vy: -300,
          maxLife: 1.5,
          color: '#ff0000',
          type: 'text',
          text: 'CRITICAL!',
        }));
      }

      // ── 산산조각 (Shatter) 효과 추가 ──
      if (actionState.faintedSide) {
        const faintedCenter = actionState.faintedSide === 'player' ? playerCenter : enemyCenter;
        // 터지는 파편들 (수백개)
        for (let i = 0; i < 200; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 1200 + 200; // 넓고 강하게 방사
          particlesRef.current.push(new Particle({
            x: faintedCenter.x + (Math.random() - 0.5) * 80,
            y: faintedCenter.y + (Math.random() - 0.5) * 80,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 500, // 살짝 위로 튀어오름
            maxLife: Math.random() * 1.5 + 0.5,
            size: Math.random() * 8 + 4,
            color: Math.random() > 0.5 ? '#ffffff' : randomColor(), // 흰색과 속성색 혼합
            type: 'shatter',
          }));
        }
      }
    } else if (actionState.animState === 'evade') {
      particlesRef.current.push(new Particle({
        x: targetCenter.x,
        y: targetCenter.y - 60,
        vx: 0,
        vy: -200,
        maxLife: 1.2,
        color: '#aaaaaa',
        type: 'text',
        text: 'MISS',
      }));
    }
  }, [actionState, playerRef, enemyRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-50 w-full h-full mix-blend-screen"
    />
  );
}

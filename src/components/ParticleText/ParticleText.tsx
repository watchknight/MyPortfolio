import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './ParticleText.module.css';

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
}

interface ParticleGroup {
  color: string;
  particles: Particle[];
}

interface ParticleTextProps {
  lines?: Array<{
    text: string;
    highlight?: boolean;
  }>;
  className?: string;
  dataCursor?: string;
  dataCursorLabel?: string;
}

const DEFAULT_LINES = [
  { text: 'Hi, This is Moayed. I build', highlight: false },
  { text: 'fast, reliable software.', highlight: true },
];

export function ParticleText({
  lines = DEFAULT_LINES,
  className = '',
  dataCursor = 'repel',
  dataCursorLabel = 'DEFLECT',
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationId: number | null = null;
    let isRunning = false;
    let groups: ParticleGroup[] = [];
    let isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    let mouseX = -10000;
    let mouseY = -10000;
    let isMouseActive = false;
    let lastWidth = 0;

    const buildParticles = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(280, Math.floor(rect.width));
      if (width === 0) return;
      lastWidth = width;

      isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const offCanvas = document.createElement('canvas');
      const octx = offCanvas.getContext('2d', { willReadFrequently: true });
      if (!octx) return;

      const fontFamily = '"Instrument Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      let fontSize = Math.floor(Math.min(width * 0.076, 50));
      const minFontSize = 17;

      octx.font = `700 ${fontSize}px ${fontFamily}`;
      const maxAllowedWidth = width * 0.96;

      while (fontSize > minFontSize) {
        octx.font = `700 ${fontSize}px ${fontFamily}`;
        const line1W = octx.measureText(lines[0]?.text || '').width;
        const line2W = octx.measureText(lines[1]?.text || '').width;
        if (line1W <= maxAllowedWidth && line2W <= maxAllowedWidth) break;
        fontSize -= 1;
      }

      const lineHeight = Math.round(fontSize * 1.24);
      const topPadding = Math.round(fontSize * 0.12);
      const height = Math.round(lineHeight * lines.length + topPadding + fontSize * 0.2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      offCanvas.width = width;
      offCanvas.height = height;
      octx.clearRect(0, 0, width, height);
      octx.font = `700 ${fontSize}px ${fontFamily}`;
      octx.textAlign = 'left';
      octx.textBaseline = 'top';

      lines.forEach((line, index) => {
        octx.fillStyle = line.highlight ? '#00FF00' : '#FF0000';
        const y = topPadding + index * lineHeight;
        octx.fillText(line.text, 0, y);
      });

      const imgData = octx.getImageData(0, 0, width, height).data;

      const darkLine1Colors = [
        'rgba(255, 255, 255, 0.98)',
        'rgba(241, 245, 249, 0.92)',
        'rgba(56, 189, 248, 0.9)',
        'rgba(192, 132, 252, 0.85)',
      ];

      const darkLine2Colors = [
        'rgba(56, 189, 248, 1)',
        'rgba(129, 140, 248, 1)',
        'rgba(52, 211, 153, 0.95)',
        'rgba(192, 132, 252, 0.95)',
        'rgba(224, 242, 254, 1)',
      ];

      const lightLine1Colors = [
        'rgba(15, 23, 42, 0.95)',
        'rgba(30, 41, 59, 0.9)',
        'rgba(71, 85, 105, 0.85)',
      ];

      const lightLine2Colors = [
        'rgba(2, 132, 199, 1)',
        'rgba(79, 70, 229, 0.98)',
        'rgba(13, 148, 136, 0.95)',
      ];

      const line1Palette = isDark ? darkLine1Colors : lightLine1Colors;
      const line2Palette = isDark ? darkLine2Colors : lightLine2Colors;

      const newGroups: ParticleGroup[] = [
        ...line1Palette.map((color) => ({ color, particles: [] as Particle[] })),
        ...line2Palette.map((color) => ({ color, particles: [] as Particle[] })),
      ];

      const step = width < 600 ? 2.5 : 2.8;
      const line1GroupCount = line1Palette.length;
      const line2GroupCount = line2Palette.length;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const pixelIndex = (Math.floor(y) * width + Math.floor(x)) * 4;
          const r = imgData[pixelIndex];
          const g = imgData[pixelIndex + 1];
          const a = imgData[pixelIndex + 3];

          if (a > 50) {
            const initialScatter = prefersReducedMotion ? 0 : 30;
            const px = x + (Math.random() - 0.5) * initialScatter;
            const py = y + (Math.random() - 0.5) * initialScatter;

            const particle: Particle = {
              x: px,
              y: py,
              tx: x,
              ty: y,
              vx: 0,
              vy: 0,
            };

            if (g > r) {
              const gIndex = line1GroupCount + Math.floor(Math.random() * line2GroupCount);
              newGroups[gIndex].particles.push(particle);
            } else {
              const gIndex = Math.floor(Math.random() * line1GroupCount);
              newGroups[gIndex].particles.push(particle);
            }
          }
        }
      }

      groups = newGroups;
      container.style.minHeight = `${height}px`;
    };

    const drawStatic = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.clearRect(0, 0, width, height);

      const dotSize = width < 600 ? 1.8 : 2.05;
      for (const group of groups) {
        ctx.fillStyle = group.color;
        for (const p of group.particles) {
          ctx.fillRect(p.tx, p.ty, dotSize, dotSize);
        }
      }
    };

    const loop = () => {
      if (!isRunning) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      const repelRadius = width < 600 ? 65 : 85;
      const repelRadiusSq = repelRadius * repelRadius;
      const dotSize = width < 600 ? 1.8 : 2.05;

      for (const group of groups) {
        ctx.fillStyle = group.color;

        for (const p of group.particles) {
          p.vx += (p.tx - p.x) * 0.024;
          p.vy += (p.ty - p.y) * 0.024;

          if (isMouseActive) {
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const d2 = dx * dx + dy * dy;

            if (d2 < repelRadiusSq) {
              const d = Math.sqrt(d2) || 1;
              const force = ((repelRadius - d) / repelRadius) * 2.6;
              p.vx += (dx / d) * force;
              p.vy += (dy / d) * force;
            }
          }

          p.vx *= 0.88;
          p.vy *= 0.88;
          p.x += p.vx;
          p.y += p.vy;

          ctx.fillRect(p.x, p.y, dotSize, dotSize);
        }
      }

      if (isMouseActive && mouseX >= -10 && mouseX <= width + 10 && mouseY >= -10 && mouseY <= height + 10) {
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.45)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, width < 600 ? 22 : 28, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.shadowBlur = 8;
        ctx.shadowColor = isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(2, 132, 199, 0.6)';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (prefersReducedMotion) {
        drawStatic();
        return;
      }
      if (!isRunning) {
        isRunning = true;
        animationId = requestAnimationFrame(loop);
      }
    };

    const stop = () => {
      isRunning = false;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseActive = true;
      if (!isRunning && !prefersReducedMotion) {
        start();
      }
    };

    const handlePointerLeave = () => {
      mouseX = -10000;
      mouseY = -10000;
      isMouseActive = false;
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const rect = container.getBoundingClientRect();
        if (Math.abs(rect.width - lastWidth) > 5) {
          buildParticles();
          if (prefersReducedMotion) {
            drawStatic();
          }
        }
      }, 150);
    });
    resizeObserver.observe(container);

    const themeObserver = new MutationObserver(() => {
      buildParticles();
      if (prefersReducedMotion) {
        drawStatic();
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            start();
          } else {
            stop();
          }
        });
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        buildParticles();
        if (prefersReducedMotion) {
          drawStatic();
        } else {
          start();
        }
      });
    } else {
      buildParticles();
      if (prefersReducedMotion) {
        drawStatic();
      } else {
        start();
      }
    }

    return () => {
      stop();
      clearTimeout(resizeTimer);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [lines, prefersReducedMotion]);

  const accessibleTitle = lines.map((l) => l.text).join(' ');

  return (
    <div
      ref={containerRef}
      className={`${styles.particleContainer} ${className}`}
      data-cursor={dataCursor}
      data-cursor-label={dataCursorLabel}
      aria-label={accessibleTitle}
    >
      <h1 className={styles.srOnly}>{accessibleTitle}</h1>
      <canvas
        ref={canvasRef}
        className={styles.particleCanvas}
        aria-hidden="true"
      />
    </div>
  );
}

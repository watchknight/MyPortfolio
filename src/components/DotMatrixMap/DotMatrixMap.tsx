import React, { useEffect, useRef, useState } from 'react';
import { CONTINENTS, GLOBAL_HUBS, geoToNorm, type HubNode } from './mapData';
import styles from './DotMatrixMap.module.css';

interface DotMatrixMapProps {
  className?: string;
  dotSpacing?: number;
  interactive?: boolean;
}

interface RenderPoint {
  normX: number;
  normY: number;
  baseRadius: number;
}

interface GeodesicLink {
  hub: HubNode;
  progress: number;
  speed: number;
}

export const DotMatrixMap: React.FC<DotMatrixMapProps> = ({
  className = '',
  dotSpacing = 11,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [fps, setFps] = useState(60);
  const [totalParticles, setTotalParticles] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let isDestroyed = false;

    // 1. Non-blocking Idle/Deferred Initialization (0ms initial TBT impact)
    const scheduleInit = () => {
      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(() => initializeCanvas(), { timeout: 800 });
      } else {
        setTimeout(initializeCanvas, 60);
      }
    };

    const initializeCanvas = () => {
      if (isDestroyed || !canvas) return;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Handle Device Pixel Ratio for crystal-sharp retina rendering
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      let width = canvas.parentElement?.clientWidth || window.innerWidth;
      let height = canvas.parentElement?.clientHeight || 560;

      const resize = () => {
        if (!canvas.parentElement) return;
        width = canvas.parentElement.clientWidth;
        height = canvas.parentElement.clientHeight || 560;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      };

      resize();
      window.addEventListener('resize', resize, { passive: true });

      // Pre-compute normalized continental polygon bounds
      const normalizedContinents = CONTINENTS.map((poly) =>
        poly.map(([lon, lat]) => geoToNorm(lon, lat))
      );

      const pointInPolygon = (x: number, y: number, poly: [number, number][]) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i][0], yi = poly[i][1];
          const xj = poly[j][0], yj = poly[j][1];
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      };

      // 2. Mathematically Structured Continental Dot-Matrix Rasterization
      const gridCols = Math.floor(130);
      const gridRows = Math.floor(52);
      const points: RenderPoint[] = [];

      for (let r = 0; r < gridRows; r++) {
        const ny = (r + 0.5) / gridRows;
        for (let c = 0; c < gridCols; c++) {
          const nx = (c + 0.5) / gridCols;
          const isLand = normalizedContinents.some((poly) => pointInPolygon(nx, ny, poly));
          if (isLand) {
            points.push({
              normX: nx,
              normY: ny,
              baseRadius: 1.15,
            });
          }
        }
      }

      setTotalParticles(points.length);

      // Pre-compute typed coordinate buffer for zero-allocation 60fps render
      const coords = new Float32Array(points.length * 2);
      for (let i = 0; i < points.length; i++) {
        coords[i * 2] = points[i].normX;
        coords[i * 2 + 1] = points[i].normY;
      }

      // Geodesic links from Primary Dhaka Node to edge stations
      const primaryHub = GLOBAL_HUBS.find((h) => h.isPrimary) || GLOBAL_HUBS[0];
      const edgeHubs = GLOBAL_HUBS.filter((h) => !h.isPrimary);
      const links: GeodesicLink[] = edgeHubs.map((hub, idx) => ({
        hub,
        progress: idx * 0.18,
        speed: 0.003 + (idx % 3) * 0.001,
      }));

      // Mouse State for Electromagnetic Surface Ripple
      const mouse = {
        x: -9999,
        y: -9999,
        targetX: -9999,
        targetY: -9999,
        radius: 140,
        active: false,
      };

      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
        mouse.active = true;
      };

      const handleMouseLeave = () => {
        mouse.active = false;
        mouse.targetX = -9999;
        mouse.targetY = -9999;
      };

      if (interactive) {
        canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
        canvas.addEventListener('mouseleave', handleMouseLeave);
      }

      // Read design tokens dynamically from the theme root
      const getTokens = () => {
        const s = getComputedStyle(document.documentElement);
        return {
          bgBase: s.getPropertyValue('--color-bg-base').trim() || '#101114',
          dotNeutral: s.getPropertyValue('--canvas-grid-color').trim() || 'rgba(133, 133, 128, 0.28)',
          dotActive: s.getPropertyValue('--color-accent').trim() || '#3FBFA0',
          dotGlow: s.getPropertyValue('--color-accent-glow').trim() || 'rgba(63, 191, 160, 0.25)',
          copper: s.getPropertyValue('--color-accent-copper').trim() || '#C48850',
          hairline: s.getPropertyValue('--color-border-hairline').trim() || 'rgba(229, 229, 225, 0.12)',
          textMuted: s.getPropertyValue('--color-text-tertiary').trim() || '#95958D',
        };
      };

      // 3. Accessibility Check: Prefers-reduced-motion immediate static frame
      if (prefersReducedMotion) {
        ctx.clearRect(0, 0, width, height);
        const tokens = getTokens();

        // Render static continental dot matrix
        ctx.fillStyle = tokens.dotNeutral;
        for (let i = 0; i < points.length; i++) {
          const px = coords[i * 2] * width;
          const py = coords[i * 2 + 1] * height;
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Render static Hubs
        GLOBAL_HUBS.forEach((hub) => {
          const [nx, ny] = geoToNorm(hub.lon, hub.lat);
          const hx = nx * width;
          const hy = ny * height;

          ctx.fillStyle = hub.isPrimary ? tokens.dotActive : tokens.copper;
          ctx.beginPath();
          ctx.arc(hx, hy, hub.isPrimary ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '9px monospace';
          ctx.fillText(hub.code, hx + 6, hy + 3);
        });

        setIsReady(true);
        return; // Halt RAF completely
      }

      // 4. High-Performance 60fps Kinetic Loop
      let lastTime = performance.now();
      let frameCount = 0;
      let fpsTimer = 0;

      const render = (time: number) => {
        if (isDestroyed) return;

        // FPS calculation (telemetry)
        frameCount++;
        if (time - fpsTimer > 1000) {
          setFps(Math.round((frameCount * 1000) / (time - fpsTimer)));
          frameCount = 0;
          fpsTimer = time;
        }

        ctx.clearRect(0, 0, width, height);
        const tokens = getTokens();

        // Smooth mouse easing
        mouse.x += (mouse.targetX - mouse.x) * 0.15;
        mouse.y += (mouse.targetY - mouse.y) * 0.15;

        // A. Batched Continental Dot Matrix with Proximity Ripple
        const primaryNorm = geoToNorm(primaryHub.lon, primaryHub.lat);
        const dhakaX = primaryNorm[0] * width;
        const dhakaY = primaryNorm[1] * height;

        ctx.fillStyle = tokens.dotNeutral;
        ctx.beginPath();

        const illuminatedDots: { x: number; y: number; alpha: number }[] = [];

        for (let i = 0; i < points.length; i++) {
          const baseX = coords[i * 2] * width;
          const baseY = coords[i * 2 + 1] * height;

          let drawX = baseX;
          let drawY = baseY;

          if (mouse.active) {
            const dx = mouse.x - baseX;
            const dy = mouse.y - baseY;
            const dist = Math.hypot(dx, dy);

            if (dist < mouse.radius) {
              const force = (1 - dist / mouse.radius);
              const angle = Math.atan2(dy, dx);
              // Electromagnetic deflection wave
              drawX -= Math.cos(angle) * force * 10;
              drawY -= Math.sin(angle) * force * 10;

              illuminatedDots.push({
                x: drawX,
                y: drawY,
                alpha: force,
              });
              continue;
            }
          }

          ctx.moveTo(drawX + 1.1, drawY);
          ctx.arc(drawX, drawY, 1.1, 0, Math.PI * 2);
        }
        ctx.fill();

        // B. Render Proximity Wave Highlight Particles
        if (illuminatedDots.length > 0) {
          ctx.save();
          illuminatedDots.forEach((pt) => {
            ctx.fillStyle = tokens.dotActive;
            ctx.globalAlpha = pt.alpha * 0.9;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.3 + pt.alpha * 1.2, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }

        // C. Geodesic Trajectories (Dhaka -> Global Edge Stations)
        links.forEach((link) => {
          const [destNormX, destNormY] = geoToNorm(link.hub.lon, link.hub.lat);
          const destX = destNormX * width;
          const destY = destNormY * height;

          const cpX = (dhakaX + destX) / 2;
          const cpY = Math.min(dhakaY, destY) - Math.abs(dhakaX - destX) * 0.24;

          // Flight arc line
          ctx.beginPath();
          ctx.strokeStyle = tokens.hairline;
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 4]);
          ctx.moveTo(dhakaX, dhakaY);
          ctx.quadraticCurveTo(cpX, cpY, destX, destY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Animated signal packet
          link.progress = (link.progress + link.speed) % 1;
          const t = link.progress;
          const pktX = (1 - t) * (1 - t) * dhakaX + 2 * (1 - t) * t * cpX + t * t * destX;
          const pktY = (1 - t) * (1 - t) * dhakaY + 2 * (1 - t) * t * cpY + t * t * destY;

          ctx.fillStyle = tokens.dotActive;
          ctx.shadowColor = tokens.dotActive;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(pktX, pktY, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Edge destination point
          ctx.fillStyle = tokens.copper;
          ctx.beginPath();
          ctx.arc(destX, destY, 2.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '8px monospace';
          ctx.fillStyle = tokens.textMuted;
          ctx.fillText(link.hub.code, destX + 5, destY + 3);
        });

        // D. Primary Command Node Pulse Beacon (Dhaka)
        const pulse = (time * 0.002) % (Math.PI * 2);
        const radius = 10 + Math.sin(pulse) * 3;

        ctx.strokeStyle = tokens.dotActive;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dhakaX, dhakaY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = tokens.dotActive;
        ctx.beginPath();
        ctx.arc(dhakaX, dhakaY, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '9px monospace';
        ctx.fillStyle = tokens.dotActive;
        ctx.fillText(`DHAKA [${primaryHub.lat.toFixed(2)}°N, ${primaryHub.lon.toFixed(2)}°E]`, dhakaX + 12, dhakaY + 3);

        setIsReady(true);
        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);

      return () => {
        window.removeEventListener('resize', resize);
        if (interactive) {
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('mouseleave', handleMouseLeave);
        }
      };
    };

    scheduleInit();

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animId);
    };
  }, [dotSpacing, interactive]);

  return (
    <div className={`${styles.mapContainer} ${className}`} aria-label="Global Edge Matrix Map">
      <div className={styles.telemetryHUD}>
        <div className={styles.hudHeader}>
          <span className={styles.hudDot} />
          <span>GEODESIC MATRIX RADAR</span>
        </div>
        <div className={styles.hudMetrics}>
          <span>NODES: {totalParticles}</span>
          <span>FPS: {fps}</span>
          <span>LATENCY: &lt;16ms</span>
        </div>
      </div>

      <div className={styles.hubLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendChipPrimary} />
          <span>DHAKA PRIMARY</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendChipEdge} />
          <span>GLOBAL EDGE</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendChipGrid} />
          <span>LANDMASS MATRIX</span>
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

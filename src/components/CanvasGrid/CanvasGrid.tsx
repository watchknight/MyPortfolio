import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './CanvasGrid.module.css';

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
}

interface EdgeDestination {
  code: string;
  name: string;
  xRatio: number;
  yRatio: number;
  progress: number;
  speed: number;
}

export function CanvasGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with easing
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 180,
      active: false,
    };

    // Calculate grid spacing
    const spacing = Math.max(50, Math.min(80, Math.floor(width / 20)));
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    // Create ambient nodes
    const nodesCount = Math.min(35, Math.floor((width * height) / 35000));
    const nodes: Node[] = [];

    for (let i = 0; i < nodesCount; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      nodes.push({
        x: rx,
        y: ry,
        baseX: rx,
        baseY: ry,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 1,
      });
    }

    const destinations: EdgeDestination[] = [
      { code: 'FRA', name: 'Frankfurt', xRatio: 0.32, yRatio: 0.28, progress: 0.1, speed: 0.0032 },
      { code: 'TYO', name: 'Tokyo', xRatio: 0.88, yRatio: 0.32, progress: 0.5, speed: 0.0038 },
      { code: 'LON', name: 'London', xRatio: 0.22, yRatio: 0.34, progress: 0.8, speed: 0.003 },
      { code: 'SIN', name: 'Singapore', xRatio: 0.74, yRatio: 0.72, progress: 0.3, speed: 0.0045 },
      { code: 'SFO', name: 'San Francisco', xRatio: 0.1, yRatio: 0.46, progress: 0.65, speed: 0.0026 },
    ];

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Get theme colors from DOM
    const getThemeColors = () => {
      const style = getComputedStyle(document.documentElement);
      return {
        grid: style.getPropertyValue('--canvas-grid-color').trim() || 'rgba(148, 163, 184, 0.08)',
        particle: style.getPropertyValue('--canvas-particle-color').trim() || 'rgba(56, 189, 248, 0.5)',
        line: style.getPropertyValue('--canvas-line-color').trim() || 'rgba(56, 189, 248, 0.15)',
      };
    };

    // Render loop
    const render = () => {
      if (prefersReducedMotion) {
        // Render simple static grid once
        ctx.clearRect(0, 0, width, height);
        const colors = getThemeColors();
        ctx.fillStyle = colors.grid;

        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const gx = c * spacing;
            const gy = r * spacing;
            // Draw small crosshair
            ctx.fillRect(gx - 2, gy, 4, 1);
            ctx.fillRect(gx, gy - 2, 1, 4);
          }
        }
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const colors = getThemeColors();

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      // 1. Draw reactive coordinate grid vertices
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const gx = c * spacing;
          const gy = r * spacing;

          // Compute distance to mouse
          const dx = mouse.x - gx;
          const dy = mouse.y - gy;
          const dist = Math.hypot(dx, dy);

          let drawX = gx;
          let drawY = gy;

          if (dist < mouse.radius && mouse.active) {
            const force = (1 - dist / mouse.radius) * 14;
            const angle = Math.atan2(dy, dx);
            drawX = gx - Math.cos(angle) * force;
            drawY = gy - Math.sin(angle) * force;
          }

          // Draw crosshair reticle
          ctx.beginPath();
          ctx.moveTo(drawX - 2.5, drawY);
          ctx.lineTo(drawX + 2.5, drawY);
          ctx.moveTo(drawX, drawY - 2.5);
          ctx.lineTo(drawX, drawY + 2.5);
          ctx.stroke();
        }
      }

      // 2. Update & Draw ambient particle network
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Particle drift
        n.x += n.vx;
        n.y += n.vy;

        // Bounce off edges
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // Mouse proximity reaction
        const mdx = mouse.x - n.x;
        const mdy = mouse.y - n.y;
        const mdist = Math.hypot(mdx, mdy);

        let px = n.x;
        let py = n.y;

        if (mdist < mouse.radius * 1.2 && mouse.active) {
          const mforce = (1 - mdist / (mouse.radius * 1.2)) * 18;
          const angle = Math.atan2(mdy, mdx);
          px = n.x + Math.cos(angle) * mforce;
          py = n.y + Math.sin(angle) * mforce;

          // Connect laser beam to mouse cursor
          ctx.beginPath();
          ctx.strokeStyle = colors.line;
          ctx.lineWidth = 0.8;
          ctx.moveTo(px, py);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(px, py, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.particle;
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const ndx = px - n2.x;
          const ndy = py - n2.y;
          const ndist = Math.hypot(ndx, ndy);

          if (ndist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = colors.line;
            ctx.lineWidth = Math.max(0.2, (1 - ndist / 110) * 0.7);
            ctx.moveTo(px, py);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // 3. Geodesic Flight Arcs & Dhaka Coordinate Hub
      const dhakaX = width * 0.65;
      const dhakaY = height * 0.48;

      ctx.save();
      const pulseTime = Date.now() * 0.002;
      const pulseRadius = 12 + Math.sin(pulseTime) * 3;

      // Pulse beacon at Dhaka
      ctx.strokeStyle = colors.particle;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(dhakaX, dhakaY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(dhakaX, dhakaY, 3, 0, Math.PI * 2);
      ctx.fillStyle = colors.particle;
      ctx.fill();

      // Dhaka Crosshair Reticle
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(dhakaX - 10, dhakaY);
      ctx.lineTo(dhakaX + 10, dhakaY);
      ctx.moveTo(dhakaX, dhakaY - 10);
      ctx.lineTo(dhakaX, dhakaY + 10);
      ctx.stroke();

      // Dhaka label if viewport wide enough
      if (width > 860) {
        ctx.font = '9px monospace';
        ctx.fillStyle = colors.particle;
        ctx.fillText('DHAKA [23.8103°N, 90.4125°E]', dhakaX + 14, dhakaY + 3);
      }

      // Flight Arcs to Global Edge Nodes
      for (const dest of destinations) {
        const targetX = width * dest.xRatio;
        const targetY = height * dest.yRatio;

        const cpX = (dhakaX + targetX) / 2;
        const cpY = Math.min(dhakaY, targetY) - Math.abs(dhakaX - targetX) * 0.22;

        // Faint curved geodesic trajectory
        ctx.beginPath();
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 0.7;
        ctx.setLineDash([3, 4]);
        ctx.moveTo(dhakaX, dhakaY);
        ctx.quadraticCurveTo(cpX, cpY, targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target edge station
        ctx.fillStyle = colors.particle;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (width > 860) {
          ctx.font = '9px monospace';
          ctx.fillStyle = colors.particle;
          ctx.fillText(dest.code, targetX + 6, targetY + 3);
        }

        // Animated signal packet along arc
        dest.progress = (dest.progress + dest.speed) % 1;
        const t = dest.progress;
        const packetX = Math.pow(1 - t, 2) * dhakaX + 2 * (1 - t) * t * cpX + Math.pow(t, 2) * targetX;
        const packetY = Math.pow(1 - t, 2) * dhakaY + 2 * (1 - t) * t * cpY + Math.pow(t, 2) * targetY;

        ctx.beginPath();
        ctx.arc(packetX, packetY, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [prefersReducedMotion]);

  return (
    <div className={styles.canvasContainer} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

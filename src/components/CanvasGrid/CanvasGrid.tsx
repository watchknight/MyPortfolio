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

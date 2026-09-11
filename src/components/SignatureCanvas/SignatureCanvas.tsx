import { useRef, useState, useEffect } from 'react';
import { ScrambleText } from '../ScrambleText/ScrambleText';
import { sound } from '../../utils/audio';
import styles from './SignatureCanvas.module.css';

interface Point {
  x: number;
  y: number;
}

export function SignatureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [color, setColor] = useState('#38bdf8'); // Cyan default
  const [lineWidth, setLineWidth] = useState(3);
  const [strokeCount, setStrokeCount] = useState(0);
  const lastPointRef = useRef<Point | null>(null);

  const colors = [
    { label: 'Cyan', val: '#38bdf8' },
    { label: 'Emerald', val: '#10b981' },
    { label: 'Violet', val: '#c084fc' },
    { label: 'Amber', val: '#f59e0b' },
  ];

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setHasDrawn(true);
    lastPointRef.current = coords;
    sound.playClick(600, 0.015, 0.03);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    if (!coords || !lastPointRef.current) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPointRef.current = coords;
    setStrokeCount((prev) => prev + 1);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPointRef.current = null;
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setStrokeCount(0);
    sound.playTick();
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `moayed-guest-signature-${Date.now().toString(36)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    sound.playChirp(700, 1100, 0.05, 0.06);
  };

  return (
    <div className={styles.guestbookWrapper} data-lenis-prevent="true">
      <div className={styles.guestbookHead}>
        <div className={styles.titleArea}>
          <div className={styles.badgeRow}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeText}>INTERACTIVE GUESTBOOK</span>
          </div>
          <h3 className={styles.title} data-cursor="inspect" data-cursor-label="GUESTBOOK">
            <ScrambleText text="Leave Your Digital Mark" />
          </h3>
          <p className={styles.subtitle}>
            Sign or sketch with neon digital ink. Your coordinates render live on the canvas.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className={styles.toolbar}>
          {/* Color pickers */}
          <div className={styles.colorGroup}>
            {colors.map((c) => (
              <button
                key={c.val}
                type="button"
                className={`${styles.colorBtn} ${color === c.val ? styles.colorActive : ''}`}
                style={{ backgroundColor: c.val }}
                onClick={() => {
                  setColor(c.val);
                  sound.playClick(800, 0.01, 0.03);
                }}
                aria-label={`Select ${c.label} color`}
                data-cursor="link"
              />
            ))}
          </div>

          {/* Stroke size */}
          <div className={styles.sizeGroup}>
            <button
              type="button"
              className={`${styles.sizeBtn} ${lineWidth === 2 ? styles.sizeActive : ''}`}
              onClick={() => setLineWidth(2)}
              title="Fine stroke"
              data-cursor="link"
            >
              •
            </button>
            <button
              type="button"
              className={`${styles.sizeBtn} ${lineWidth === 4 ? styles.sizeActive : ''}`}
              onClick={() => setLineWidth(4)}
              title="Medium stroke"
              data-cursor="link"
            >
              ●
            </button>
            <button
              type="button"
              className={`${styles.sizeBtn} ${lineWidth === 7 ? styles.sizeActive : ''}`}
              onClick={() => setLineWidth(7)}
              title="Bold stroke"
              data-cursor="link"
            >
              ⬤
            </button>
          </div>

          {/* Actions */}
          <div className={styles.actionGroup}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={clearCanvas}
              disabled={!hasDrawn}
              data-cursor="link"
            >
              Clear
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionSave}`}
              onClick={downloadSignature}
              disabled={!hasDrawn}
              data-cursor="link"
            >
              Save Badge ↓
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Drawing Surface */}
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasDrawn && (
          <div className={styles.canvasPlaceholder} aria-hidden="true">
            <span className={styles.drawHand}>✍️</span>
            <span>Click &amp; drag your mouse or touch here to sign...</span>
          </div>
        )}

        <div className={styles.canvasFooterInfo}>
          <span>VIRTUAL HARDWARE RASTERIZER // 60 FPS</span>
          <span>{hasDrawn ? `${strokeCount} VECTORS RECORDED` : 'WAITING FOR INPUT'}</span>
        </div>
      </div>
    </div>
  );
}

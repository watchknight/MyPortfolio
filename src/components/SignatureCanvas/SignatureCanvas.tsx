import { useRef, useState, useEffect, useCallback } from 'react';
import { sound } from '../../audio/sound.js';
import { wireGuestbook } from '../../audio/wire.js';
import { useScrollLock } from '../../utils/scrollLock';
import styles from './SignatureCanvas.module.css';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  colorToken: string;
  width: number;
}

export function SignatureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement>(null);

  const [drawSheetOpen, setDrawSheetOpen] = useState(false);
  const [activeToken, setActiveToken] = useState('--accent');
  const [lineWidth, setLineWidth] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);

  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);

  useScrollLock(drawSheetOpen);

  const hasDrawn = strokes.length > 0;
  const maxStrokeY = strokes.reduce((max, stroke) => {
    return stroke.points.reduce((m, pt) => Math.max(m, pt.y), max);
  }, 0);
  const containerHeight =
    hasDrawn && maxStrokeY > 184 ? Math.ceil(maxStrokeY + 36) : undefined;

  const colors = [
    { label: 'Text', token: '--text' },
    { label: 'Accent', token: '--accent' },
    { label: 'Control', token: '--control' },
  ];

  const redrawCanvas = useCallback((canvas: HTMLCanvasElement | null, allStrokes: Stroke[]) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rootStyle = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;

    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      const color = rootStyle?.getPropertyValue(stroke.colorToken).trim() || '#FFB224';
      ctx.strokeStyle = color;
      ctx.lineWidth = stroke.width;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    ctx.restore();
  }, []);

  // Redraw inline canvas when strokes, sheet state, or container height changes
  useEffect(() => {
    if (!drawSheetOpen) {
      redrawCanvas(canvasRef.current, strokes);
      const raf = requestAnimationFrame(() => {
        redrawCanvas(canvasRef.current, strokes);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [strokes, drawSheetOpen, containerHeight, redrawCanvas]);

  // Window resize handler for inline canvas
  useEffect(() => {
    const handleResize = () => {
      redrawCanvas(canvasRef.current, strokes);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes, redrawCanvas]);

  // Redraw sheet canvas when opened or resized
  useEffect(() => {
    if (!drawSheetOpen) return;
    const timer = setTimeout(() => {
      redrawCanvas(sheetCanvasRef.current, strokes);
    }, 50);
    return () => clearTimeout(timer);
  }, [drawSheetOpen, strokes, redrawCanvas]);

  // Wire guestbook ink sound to canvases
  useEffect(() => {
    if (canvasRef.current) {
      return wireGuestbook(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (drawSheetOpen && sheetCanvasRef.current) {
      return wireGuestbook(sheetCanvasRef.current);
    }
  }, [drawSheetOpen]);

  const getCanvasCoords = (
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ): Point => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Drawing logic for any canvas
  const handlePointerStart = (
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ) => {
    isDrawingRef.current = true;
    const pt = getCanvasCoords(canvas, clientX, clientY);
    currentPointsRef.current = [pt];
  };

  const handlePointerMove = (
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasCoords(canvas, clientX, clientY);
    currentPointsRef.current.push(pt);

    // Live paint segment
    const ctx = canvas.getContext('2d');
    if (ctx && currentPointsRef.current.length >= 2) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const rootStyle = getComputedStyle(document.documentElement);
      ctx.strokeStyle = rootStyle.getPropertyValue(activeToken).trim() || '#FFB224';
      ctx.lineWidth = lineWidth;

      const pts = currentPointsRef.current;
      const prev = pts[pts.length - 2];
      const curr = pts[pts.length - 1];

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerEnd = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentPointsRef.current.length >= 2) {
      const newStroke: Stroke = {
        points: [...currentPointsRef.current],
        colorToken: activeToken,
        width: lineWidth,
      };
      setStrokes((prev) => [...prev, newStroke]);
      setStrokeCount((prev) => prev + currentPointsRef.current.length);
    }
    currentPointsRef.current = [];
  };

  const clearCanvas = () => {
    setStrokes([]);
    setStrokeCount(0);
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;
    redrawCanvas(canvas, strokes);
    const link = document.createElement('a');
    link.download = `moayed-guest-signature-${Date.now().toString(36)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    sound.play('chime');
  };

  const openDrawSheet = () => {
    setDrawSheetOpen(true);
  };

  const closeDrawSheet = () => {
    setDrawSheetOpen(false);
  };

  return (
    <div className={styles.guestbookWrapper}>
      <div className={styles.guestbookHead}>
        <div className={styles.titleArea}>
          <span className={styles.badgeText}>Interactive guestbook</span>
          <h2 className={styles.title}>Leave Your Digital Mark</h2>
          <p className={styles.subtitle}>
            Sign or sketch with digital ink. Your coordinates render live on the canvas.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className={styles.toolbar}>
          {/* "Draw" Button — opens full-screen drawing sheet */}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionDrawBtn}`}
            onClick={openDrawSheet}
            aria-label="Open full-screen drawing canvas"
            data-cursor="link"
            data-magnetic="0.3"
          >
            Draw ✍️
          </button>

          {/* Color pickers */}
          <div className={styles.colorGroup}>
            {colors.map((c) => (
              <button
                key={c.token}
                type="button"
                className={`${styles.colorBtn} ${activeToken === c.token ? styles.colorActive : ''}`}
                onClick={() => {
                  setActiveToken(c.token);
                }}
                aria-label={`Select ${c.label} color`}
                data-cursor="link"
                data-magnetic="0.3"
              >
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: `var(${c.token})` }}
                />
              </button>
            ))}
          </div>

          {/* Stroke size */}
          <div className={styles.sizeGroup}>
            <button
              type="button"
              className={`${styles.sizeBtn} ${lineWidth === 2 ? styles.sizeActive : ''}`}
              onClick={() => setLineWidth(2)}
              title="Fine stroke"
              aria-label="Fine stroke"
              data-cursor="link"
              data-magnetic="0.3"
            >
              •
            </button>
            <button
              type="button"
              className={`${styles.sizeBtn} ${lineWidth === 4 ? styles.sizeActive : ''}`}
              onClick={() => setLineWidth(4)}
              title="Medium stroke"
              aria-label="Medium stroke"
              data-cursor="link"
              data-magnetic="0.3"
            >
              ●
            </button>
            <button
              type="button"
              className={`${styles.sizeBtn} ${lineWidth === 7 ? styles.sizeActive : ''}`}
              onClick={() => setLineWidth(7)}
              title="Bold stroke"
              aria-label="Bold stroke"
              data-cursor="link"
              data-magnetic="0.3"
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
              data-magnetic="0.3"
            >
              Clear
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionSave}`}
              onClick={downloadSignature}
              disabled={!hasDrawn}
              data-cursor="link"
              data-magnetic="0.3"
            >
              Save Badge ↓
            </button>
          </div>
        </div>
      </div>

      {/* Inline Canvas (Default touch-action: pan-y to NOT trap scrolling) */}
      <div
        className={styles.canvasContainer}
        style={containerHeight ? { height: `${containerHeight}px` } : undefined}
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          data-cursor="hide"
          onMouseDown={(e) => handlePointerStart(e.currentTarget, e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.currentTarget, e.clientX, e.clientY)}
          onMouseUp={handlePointerEnd}
          onMouseLeave={handlePointerEnd}
        />

        {!hasDrawn && (
          <div className={styles.canvasPlaceholder}>
            <span className={styles.drawHand}>✍️</span>
            <span>Click &amp; drag mouse, or tap &ldquo;Draw&rdquo; on mobile to sign...</span>
            <button
              type="button"
              className={styles.placeholderDrawBtn}
              onClick={openDrawSheet}
            >
              Open Drawing Pad
            </button>
          </div>
        )}

        <div className={styles.canvasFooterInfo}>
          <span>Interactive Canvas • 60 FPS</span>
          <span>{hasDrawn ? `${strokeCount} vectors recorded` : 'Waiting for input'}</span>
        </div>
      </div>

      {/* Full-Screen Draw Sheet (touch-action: none with Done button) */}
      {drawSheetOpen && (
        <div
          className={styles.drawSheetOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Signature Drawing Pad"
        >
          <div className={styles.drawSheetHeader}>
            <div className={styles.drawSheetTitleGroup}>
              <span className={styles.drawSheetTitle}>Signature Drawing Pad</span>
              <span className={styles.drawSheetMeta}>
                {hasDrawn ? `${strokeCount} vectors recorded` : 'Draw with one finger'}
              </span>
            </div>

            <div className={styles.drawSheetHeaderActions}>
              <button
                type="button"
                className={styles.sheetClearBtn}
                onClick={clearCanvas}
                disabled={!hasDrawn}
              >
                Clear
              </button>
              <button
                type="button"
                className={styles.sheetDoneBtn}
                onClick={closeDrawSheet}
              >
                Done ✓
              </button>
            </div>
          </div>

          {/* Sheet Toolbar */}
          <div className={styles.drawSheetToolbar}>
            <div className={styles.colorGroup}>
              {colors.map((c) => (
                <button
                  key={c.token}
                  type="button"
                  className={`${styles.colorBtn} ${activeToken === c.token ? styles.colorActive : ''}`}
                  onClick={() => {
                    setActiveToken(c.token);
                  }}
                  aria-label={`Select ${c.label} color`}
                >
                  <span
                    className={styles.colorDot}
                    style={{ backgroundColor: `var(${c.token})` }}
                  />
                </button>
              ))}
            </div>

            <div className={styles.sizeGroup}>
              <button
                type="button"
                className={`${styles.sizeBtn} ${lineWidth === 2 ? styles.sizeActive : ''}`}
                onClick={() => setLineWidth(2)}
                aria-label="Fine stroke"
              >
                •
              </button>
              <button
                type="button"
                className={`${styles.sizeBtn} ${lineWidth === 4 ? styles.sizeActive : ''}`}
                onClick={() => setLineWidth(4)}
                aria-label="Medium stroke"
              >
                ●
              </button>
              <button
                type="button"
                className={`${styles.sizeBtn} ${lineWidth === 7 ? styles.sizeActive : ''}`}
                onClick={() => setLineWidth(7)}
                aria-label="Bold stroke"
              >
                ⬤
              </button>
            </div>
          </div>

          {/* Drawing Surface with touch-action: none */}
          <div className={styles.drawSheetCanvasWrap}>
            <canvas
              ref={sheetCanvasRef}
              className={styles.sheetCanvas}
              onMouseDown={(e) => handlePointerStart(e.currentTarget, e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.currentTarget, e.clientX, e.clientY)}
              onMouseUp={handlePointerEnd}
              onMouseLeave={handlePointerEnd}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  const t = e.touches[0];
                  handlePointerStart(e.currentTarget, t.clientX, t.clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) {
                  const t = e.touches[0];
                  handlePointerMove(e.currentTarget, t.clientX, t.clientY);
                }
              }}
              onTouchEnd={handlePointerEnd}
            />
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectData } from '../../data/projects';
import { MechanicalCounter } from '../MechanicalCounter/MechanicalCounter';
import { sound } from '../../utils/audio';
import styles from './ProjectLedger.module.css';

interface ProjectLedgerProps {
  projects: ProjectData[];
  onSelectProject: (p: ProjectData) => void;
}

interface TelemetryRecord {
  tag: string;
  msg: string;
  status: string;
}

const PROJECT_TELEMETRY: Record<string, TelemetryRecord[]> = {
  purefeed: [
    { tag: 'MV3::INJECT', msg: 'Main World registration active', status: 'OK' },
    { tag: 'DOM_OBS', msg: 'Scrambled sponsored feed scanner', status: 'ACTIVE' },
    { tag: 'ANAGRAM', msg: "Frequency match: 'ddenoorpss'", status: 'STRIPPED' },
    { tag: 'LATENCY', msg: 'Ad payload pruned in 3.4ms', status: '<16ms' },
  ],
  focusguard: [
    { tag: 'SINKHOLE', msg: '0.0.0.0 bind active on 580 routes', status: 'ACTIVE' },
    { tag: 'REG_SYNC', msg: 'ForceGoogleSafeSearch = 1 enforced', status: 'LOCKED' },
    { tag: 'WATCHDOG', msg: 'Integrity scanner interval 60s', status: 'VERIFIED' },
    { tag: 'DROP_NET', msg: 'Addictive host packets sinkholed', status: 'BLOCKED' },
  ],
  rannabanna: [
    { tag: 'HEURISTIC', msg: 'Vector matching: [mustard_oil, ilish]', status: 'PASS' },
    { tag: 'ALGO_PASS', msg: '395 recipes indexed in 0.8ms SQL', status: '0.8ms' },
    { tag: 'PHYSICS', msg: 'Logarithmic reduction cook physics', status: 'SCALED' },
    { tag: 'LLM_CACHE', msg: 'SHA-256 hashed bilingual cache tier', status: 'SAVED' },
  ],
  doclensbd: [
    { tag: 'MEDIAPIPE', msg: 'Face mesh extracted: 468 3D landmarks', status: '60 FPS' },
    { tag: '6DOF_HEAD', msg: 'Real-time Yaw / Pitch / Roll matrix', status: 'TRACKED' },
    { tag: 'SMOOTHER', msg: 'Weighted temporal jitter filter', status: 'STABLE' },
    { tag: 'RENDER', msg: 'Virtual optical frames aligned (0-shift)', status: 'ALIGNED' },
  ],
  poshra: [
    { tag: 'ZOD_SCHEMA', msg: 'Strict API payload validation safe', status: '100%' },
    { tag: 'ZUSTAND', msg: 'Atomic cart state hydration across tabs', status: 'SYNCED' },
    { tag: 'GATEWAY', msg: 'SSLCommerz IPN cryptographic signature', status: 'AUTH' },
    { tag: 'POSTGRES', msg: 'Idempotent transactional order ledger', status: 'PERSISTED' },
  ],
  myportfolio: [
    { tag: 'DSP_SYNTH', msg: 'Native Web Audio context initialized', status: '44.1kHz' },
    { tag: 'OSCILLATOR', msg: 'Triangle freq envelope: 850Hz -> 0Hz', status: 'TACTILE' },
    { tag: 'CANVAS_2D', msg: 'Elastic particle coordinate deflection', status: '60 FPS' },
    { tag: 'CMD_BUS', msg: 'Decoupled Raycast palette bus active', status: 'LISTENING' },
  ],
};

function DynamicTerminalLogs({
  project,
  isReducedMotion,
}: {
  project: ProjectData;
  isReducedMotion: boolean;
}) {
  const telemetry = useMemo(() => {
    return (
      PROJECT_TELEMETRY[project.id] || [
        { tag: 'INIT', msg: `${project.title} telemetry active`, status: 'ONLINE' },
        { tag: 'METRIC', msg: `${project.metric.label}: ${project.metric.value}`, status: 'VERIFIED' },
        { tag: 'RUNTIME', msg: project.environment.slice(0, 3).join(', '), status: 'ACTIVE' },
        { tag: 'INSPECT', msg: 'Ready for deep architecture audit', status: 'STANDBY' },
      ]
    );
  }, [project]);

  const [visibleCount, setVisibleCount] = useState(isReducedMotion ? telemetry.length : 1);

  useEffect(() => {
    if (isReducedMotion) return;

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev < telemetry.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 240);

    return () => clearInterval(interval);
  }, [project.id, isReducedMotion, telemetry.length]);

  return (
    <div className={styles.previewConsole}>
      {telemetry.slice(0, visibleCount).map((item, idx) => (
        <div key={idx} className={styles.previewLogLine}>
          <span className={styles.logTag}>[{item.tag}]</span>
          <span className={styles.logMsg}>{item.msg}</span>
          <span className={styles.logSuccess}>[{item.status}]</span>
        </div>
      ))}
      {!isReducedMotion && visibleCount < telemetry.length && (
        <div className={styles.cursorWrapper}>
          <span className={styles.previewCursor} />
        </div>
      )}
    </div>
  );
}

function FloatingProjectPreview({
  project,
  cardRef,
  initialPos,
  isReducedMotion,
}: {
  project: ProjectData;
  cardRef: React.RefObject<HTMLDivElement | null>;
  initialPos: { x: number; y: number };
  isReducedMotion: boolean;
}) {
  // Extract key code one-liner (skip pure comments)
  const codeLine = useMemo(() => {
    if (!project.codeHighlight?.code) return null;
    const lines = project.codeHighlight.code.split('\n');
    return lines.find((l) => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('#')) || lines[0];
  }, [project.codeHighlight]);

  const initialTransform = useMemo(() => {
    let x = initialPos.x + 24;
    let y = initialPos.y - 40;
    if (typeof window !== 'undefined') {
      if (x + 360 > window.innerWidth - 16) x = initialPos.x - 360 - 24;
      if (x < 16) x = 16;
      if (y + 220 > window.innerHeight - 16) y = initialPos.y - 220 - 16;
      if (y < 16) y = 16;
    }
    return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }, [initialPos]);

  return (
    <div
      ref={cardRef}
      className={styles.floatingPreviewCard}
      style={{ transform: initialTransform }}
      role="tooltip"
      aria-hidden="true"
    >
      {/* Precision CRT Header */}
      <div className={styles.previewHeader}>
        <div className={styles.previewHeaderLeft}>
          <div className={styles.previewDots}>
            <span className={`${styles.previewDot} ${styles.previewDotRed}`} />
            <span className={`${styles.previewDot} ${styles.previewDotYellow}`} />
            <span className={`${styles.previewDot} ${styles.previewDotGreen}`} />
          </div>
          <span className={styles.previewSerial}>
            {project.serial.replace(/^SYS_\d+\s*\/\/\s*/i, '')}
          </span>
        </div>

        <div className={styles.previewStatusBadge}>
          <span className={styles.pulseIndicator} />
          <span>LIVE TELEMETRY</span>
        </div>
      </div>

      {/* Dynamic Streaming Console */}
      <DynamicTerminalLogs project={project} isReducedMotion={isReducedMotion} />

      {/* Code Snippet Highlight */}
      {codeLine && project.codeHighlight && (
        <div className={styles.previewCodeSnippet}>
          <div className={styles.codeSnippetHeader}>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>{project.codeHighlight.filename.split('&')[0].trim()}</span>
          </div>
          <code className={styles.codeSnippetLine}>
            {codeLine.trim()}
          </code>
        </div>
      )}

      {/* Footer Metadata & Metric */}
      <div className={styles.previewFooter}>
        <div className={styles.previewMetric}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>{project.metric.label}: {project.metric.value}</span>
        </div>
        <span className={styles.previewActionHint}>Click to Inspect &rarr;</span>
      </div>
    </div>
  );
}

export function ProjectLedger({ projects, onSelectProject }: ProjectLedgerProps) {
  const [likesMap, setLikesMap] = useState<Record<string, number>>(() => {
    const initialLikes: Record<string, number> = {};
    if (typeof window !== 'undefined') {
      projects.forEach((p) => {
        const stored = localStorage.getItem(`likes_${p.id}`);
        initialLikes[p.id] = stored ? parseInt(stored, 10) : p.likes;
      });
    }
    return initialLikes;
  });

  const [userLikedMap, setUserLikedMap] = useState<Record<string, boolean>>(() => {
    const userLiked: Record<string, boolean> = {};
    if (typeof window !== 'undefined') {
      projects.forEach((p) => {
        userLiked[p.id] = localStorage.getItem(`has_liked_${p.id}`) === 'true';
      });
    }
    return userLiked;
  });

  const handleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const current = likesMap[id] || 0;
    const hasLiked = userLikedMap[id];
    const next = hasLiked ? current - 1 : current + 1;

    setLikesMap((prev) => ({ ...prev, [id]: next }));
    setUserLikedMap((prev) => ({ ...prev, [id]: !hasLiked }));

    localStorage.setItem(`likes_${id}`, next.toString());
    localStorage.setItem(`has_liked_${id}`, String(!hasLiked));

    sound.playClick(hasLiked ? 450 : 850, 0.03, 0.08);
  };

  const [sortField, setSortField] = useState<'title' | 'category' | 'likes'>('likes');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'title' | 'category' | 'likes') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    sound.playClick(720, 0.02, 0.05);
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === 'likes') {
        const aLikes = likesMap[a.id] ?? a.likes;
        const bLikes = likesMap[b.id] ?? b.likes;
        comparison = aLikes - bLikes;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [projects, sortField, sortDirection, likesMap]);

  // ── Hover & Floating Preview State ──
  const [hoveredProject, setHoveredProject] = useState<ProjectData | null>(null);
  const [activeTouchProjectId, setActiveTouchProjectId] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window !== 'undefined') return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    return false;
  });
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return false;
  });

  const [initialPreviewPos, setInitialPreviewPos] = useState({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const previewCardRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const hoveredProjectRef = useRef<ProjectData | null>(null);

  // Detect Touch and Reduced Motion media queries
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const touchMq = window.matchMedia('(hover: none) and (pointer: coarse)');
    const handleTouchChange = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    touchMq.addEventListener('change', handleTouchChange);

    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionMq.addEventListener('change', handleMotionChange);

    return () => {
      touchMq.removeEventListener('change', handleTouchChange);
      motionMq.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // RAF Smooth Cursor Lerp Positioner with Viewport Boundary Awareness
  const positionCard = useCallback(function updateCardPos() {
    if (!hoveredProjectRef.current) return;

    if (previewCardRef.current) {
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      currentPos.current.x += dx * 0.18;
      currentPos.current.y += dy * 0.18;

      const card = previewCardRef.current;
      const cardWidth = card.offsetWidth || 360;
      const cardHeight = card.offsetHeight || 220;
      const offsetDistance = 24;

      let x = currentPos.current.x + offsetDistance;
      let y = currentPos.current.y - 40;

      // Viewport Boundary Detection: Horizontal Flip
      if (x + cardWidth > window.innerWidth - 16) {
        x = currentPos.current.x - cardWidth - offsetDistance;
      }
      if (x < 16) {
        x = 16;
      }

      // Viewport Boundary Detection: Vertical Flip / Clamp
      if (y + cardHeight > window.innerHeight - 16) {
        y = currentPos.current.y - cardHeight - 16;
      }
      if (y < 16) {
        y = 16;
      }

      card.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    }

    rafId.current = requestAnimationFrame(updateCardPos);
  }, []);

  const handleRowPointerEnter = (project: ProjectData, e: React.PointerEvent | React.MouseEvent) => {
    if (isTouchDevice) return;
    hoveredProjectRef.current = project;
    setHoveredProject(project);

    targetPos.current = { x: e.clientX, y: e.clientY };
    currentPos.current = { x: e.clientX, y: e.clientY };
    setInitialPreviewPos({ x: e.clientX, y: e.clientY });

    if (!isReducedMotion) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(positionCard);
    } else {
      setTimeout(() => {
        if (previewCardRef.current) {
          const card = previewCardRef.current;
          const cardWidth = card.offsetWidth || 360;
          const cardHeight = card.offsetHeight || 220;
          let x = e.clientX + 24;
          let y = e.clientY - 40;
          if (x + cardWidth > window.innerWidth - 16) x = e.clientX - cardWidth - 24;
          if (x < 16) x = 16;
          if (y + cardHeight > window.innerHeight - 16) y = e.clientY - cardHeight - 16;
          if (y < 16) y = 16;
          card.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
        }
      }, 0);
    }
  };

  const handlePointerMove = (e: React.PointerEvent | React.MouseEvent) => {
    if (isTouchDevice) return;
    targetPos.current = { x: e.clientX, y: e.clientY };

    if (isReducedMotion && previewCardRef.current) {
      const card = previewCardRef.current;
      const cardWidth = card.offsetWidth || 360;
      const cardHeight = card.offsetHeight || 220;
      let x = e.clientX + 24;
      let y = e.clientY - 40;
      if (x + cardWidth > window.innerWidth - 16) x = e.clientX - cardWidth - 24;
      if (x < 16) x = 16;
      if (y + cardHeight > window.innerHeight - 16) y = e.clientY - cardHeight - 16;
      if (y < 16) y = 16;
      card.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    }
  };

  const handleTablePointerLeave = () => {
    if (isTouchDevice) return;
    hoveredProjectRef.current = null;
    setHoveredProject(null);
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  // Row selection handler: on mobile, 1st tap expands preview, 2nd tap opens modal
  const handleRowClick = (project: ProjectData) => {
    if (isTouchDevice) {
      if (activeTouchProjectId === project.id) {
        sound.playDrawer();
        onSelectProject(project);
      } else {
        sound.playClick(650, 0.02, 0.06);
        setActiveTouchProjectId(project.id);
      }
    } else {
      sound.playDrawer();
      onSelectProject(project);
    }
  };

  // Cancel RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div
      className={styles.ledgerContainer}
      role="table"
      aria-label="System Projects Table"
      onPointerMove={handlePointerMove}
      onMouseMove={handlePointerMove}
      onPointerLeave={handleTablePointerLeave}
      onMouseLeave={handleTablePointerLeave}
    >
      <div className={styles.ledgerHeader} role="row">
        <button
          type="button"
          className={styles.sortHeaderBtn}
          onClick={() => handleSort('title')}
          role="columnheader"
          aria-sort={sortField === 'title' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <span>System &amp; Domain</span>
          <span>{sortField === 'title' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
        </button>

        <button
          type="button"
          className={styles.sortHeaderBtn}
          onClick={() => handleSort('category')}
          role="columnheader"
          aria-sort={sortField === 'category' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <span>Domain Role</span>
          <span>{sortField === 'category' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
        </button>

        <div role="columnheader">Environment Stack</div>
        <div role="columnheader">Key Metric</div>

        <button
          type="button"
          className={styles.sortHeaderBtn}
          onClick={() => handleSort('likes')}
          role="columnheader"
          aria-sort={sortField === 'likes' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <span>Telemetry</span>
          <span>{sortField === 'likes' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
        </button>

        <div role="columnheader">Action</div>
      </div>

      {sortedProjects.map((project: ProjectData) => {
        const isHovered = hoveredProject?.id === project.id;
        const isTouchActive = isTouchDevice && activeTouchProjectId === project.id;

        return (
          <div key={project.id} className={styles.rowGroup}>
            <div
              className={`${styles.ledgerRow} ${isHovered ? styles.rowHovered : ''} ${isTouchActive ? styles.rowTouchActive : ''}`}
              role="row"
              tabIndex={0}
              onClick={() => handleRowClick(project)}
              onPointerEnter={(e) => handleRowPointerEnter(project, e)}
              onMouseEnter={(e) => handleRowPointerEnter(project, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  sound.playDrawer();
                  onSelectProject(project);
                }
              }}
              data-cursor="inspect"
              data-cursor-label="View project"
            >
              {/* Column 1: Name & Domain */}
              <div className={styles.nameCol} role="cell">
                <div className={styles.projectIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className={styles.nameMeta}>
                  <span className={styles.projectTitle}>{project.title}</span>
                  <span className={styles.projectDomain}>{project.domain}</span>
                </div>
              </div>

              {/* Column 2: Category & Role */}
              <div className={styles.categoryCol} role="cell">
                {project.category}
              </div>

              {/* Column 3: Stack */}
              <div className={styles.stackCol} role="cell">
                {project.environment.slice(0, 3).map((env: string) => (
                  <span key={env} className={styles.stackPill}>
                    {env}
                  </span>
                ))}
                {project.environment.length > 3 && (
                  <span className={styles.stackPill}>+{project.environment.length - 3}</span>
                )}
              </div>

              {/* Column 4: Metric */}
              <div className={styles.metricCol} role="cell">
                <span className={styles.metricVal}>{project.metric.value}</span>
                <span className={styles.metricLab}>{project.metric.label}</span>
              </div>

              {/* Column 5: Likes Odometer */}
              <div role="cell">
                <button
                  type="button"
                  className={`${styles.likeBtn} ${userLikedMap[project.id] ? styles.liked : ''}`}
                  onClick={(e) => handleLike(e, project.id)}
                  aria-label={`Like ${project.title}. Current count: ${likesMap[project.id] || project.likes}`}
                  data-cursor="link"
                >
                  <svg viewBox="0 0 24 24" fill={userLikedMap[project.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <MechanicalCounter value={likesMap[project.id] ?? project.likes} />
                </button>
              </div>

              {/* Column 6: Action */}
              <div role="cell">
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playDrawer();
                    onSelectProject(project);
                  }}
                  data-cursor="link"
                >
                  Inspect
                </button>
              </div>
            </div>

            {/* Mobile / Touch Inline Accordion Drawer */}
            {isTouchActive && (
              <div
                className={styles.touchInlineDrawer}
                role="region"
                aria-label={`Preview of ${project.title}`}
              >
                <div className={styles.touchDrawerHeader}>
                  <div className={styles.touchDrawerSerial}>
                    <span className={styles.pulseIndicator} />
                    <span>{project.serial.replace(/^SYS_\d+\s*\/\/\s*/i, '')}</span>
                  </div>
                  <span className={styles.touchDrawerMetric}>{project.metric.label}: {project.metric.value}</span>
                </div>

                <DynamicTerminalLogs project={project} isReducedMotion={isReducedMotion} />

                <p className={styles.touchDrawerDescription}>
                  {project.shortDescription}
                </p>

                <div className={styles.touchDrawerActions}>
                  <button
                    type="button"
                    className={styles.touchInspectBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playDrawer();
                      onSelectProject(project);
                    }}
                  >
                    <span>Inspect Full Architecture</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.touchDismissBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTouchProjectId(null);
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Floating Dynamic Preview Portal (Desktop only) */}
      {typeof document !== 'undefined' && hoveredProject && !isTouchDevice && createPortal(
        <FloatingProjectPreview
          project={hoveredProject}
          cardRef={previewCardRef}
          initialPos={initialPreviewPos}
          isReducedMotion={isReducedMotion}
        />,
        document.body
      )}
    </div>
  );
}

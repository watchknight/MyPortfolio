import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { gsap, Flip } from '../../motion/index';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ProjectSimulator } from '../../components/ProjectSimulator/ProjectSimulator';
import { ProjectLedger } from '../../components/CaseStudy/ProjectLedger';
import { previews } from '../../lib/preview-manager.js';
import { projects, type ProjectData } from '../../data/projects';
import { sound } from '../../utils/audio';
import styles from './WorksPage.module.css';

interface WorksPageProps {
  onSelectProject?: (projectId: string) => void;
}

function getSubtitle(p: ProjectData): string {
  if (p.id === 'purefeed') {
    return 'MV3 Browser Internals & Security';
  }
  return p.category.replace(/^(OS_DNS|RECIPE_AI|3D_TRYON|ECOM_STACK|DSP_ENGINE)\s*(\/\/|-|:)?\s*/i, '');
}

function getSpanClass(p: ProjectData, isFiltered: boolean, activeFilter: string): string {
  if (!isFiltered || activeFilter === 'all') {
    switch (p.id) {
      case 'purefeed':
        return `${styles.span7} span-7 rows-6`;
      case 'doclensbd':
        return `${styles.span5} span-5 rows-6`;
      case 'focusguard':
        return `${styles.span4} span-4 rows-5`;
      case 'rannabanna':
        return `${styles.span4} span-4 rows-5`;
      case 'poshra':
        return `${styles.span4} span-4 rows-5`;
      case 'myportfolio':
        return `${styles.span12} span-12 rows-3`;
      default:
        return `${styles.span4} span-4 rows-5`;
    }
  }

  if (activeFilter === 'Tool') {
    if (p.id === 'purefeed') return `${styles.span7} span-7 rows-6`;
    if (p.id === 'focusguard') return `${styles.span5} span-5 rows-6`;
  }

  if (activeFilter === 'Web App') {
    if (p.id === 'doclensbd') return `${styles.span7} span-7 rows-6`;
    if (p.id === 'rannabanna') return `${styles.span5} span-5 rows-6`;
    if (p.id === 'myportfolio') return `${styles.span12} span-12 rows-3`;
  }

  if (activeFilter === 'Commercial') {
    return `${styles.span12} span-12 rows-5`;
  }

  return `${styles.span6} span-6 rows-5`;
}

interface WorksProjectTileProps {
  project: ProjectData;
  index: number;
  spanClass: string;
  isFeatured: boolean;
  onSelectProject?: (projectId: string) => void;
}

function WorksProjectTile({
  project: p,
  index,
  spanClass,
  isFeatured,
  onSelectProject,
}: WorksProjectTileProps) {
  const [isRunning, setIsRunning] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaEl = mediaRef.current;
    if (!mediaEl) return;

    const mock = {
      start: () => setIsRunning(true),
      stop: () => setIsRunning(false),
    };

    const off = previews.register(mediaEl, {
      start: mock.start,
      stop: mock.stop,
      auto: typeof window !== 'undefined' ? !window.matchMedia('(hover: none)').matches : true,
    });

    return () => off();
  }, []);

  const isInverted = p.id === 'myportfolio';
  const subtitle = getSubtitle(p);
  const gradeClass = isFeatured ? 'grade-hard' : 'grade-lite';

  const tileClass = `${styles.bentoTile} ${spanClass} ${
    isInverted
      ? styles.tileInverted
      : isFeatured
      ? styles.tileFeatured
      : styles.tileStandard
  }`;

  const handleTileClick = () => {
    sound.play('pluck', { note: 69 });
    sound.play('swish', { dir: 1 });
    if (onSelectProject) {
      onSelectProject(p.id);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-project-modal', { detail: p.id }));
    }
  };

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mediaRef.current) return;
    if (isRunning) {
      previews.stop(mediaRef.current);
    } else {
      previews.start(mediaRef.current);
    }
  };

  return (
    <article
      className={tileClass}
      data-tile={isInverted ? 'inverted' : isFeatured ? 'feature' : 'standard'}
      data-flip-id={p.id}
      data-cursor="inspect"
      data-cursor-label="View project"
      data-degree={index}
      tabIndex={0}
      onClick={handleTileClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTileClick();
        }
      }}
    >
      {isInverted ? (
        <div className={styles.tileInvertedInner}>
          <div className={styles.tileBody}>
            <div className={styles.tileHeaderBar}>
              <span className={styles.typeChip}>{p.status}</span>
              <span className={styles.metricChip}>{p.perf}</span>
            </div>

            <h2 className={styles.tileTitle}>{p.title}</h2>
            <div className={styles.tileSubtitle}>{subtitle}</div>
            <p className={styles.tileDescClamped}>{p.shortDescription}</p>

            <div className={styles.stackChips}>
              {p.tech.map((t) => (
                <span key={t} className={styles.stackPill}>
                  {t}
                </span>
              ))}
            </div>

            <div className={styles.tileActionsRow}>
              {p.liveUrl && (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.amberPillBtn}
                  onClick={(e) => e.stopPropagation()}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <span>Visit Live Site</span>
                </a>
              )}

              <button
                type="button"
                className={p.liveUrl ? styles.archSecondaryBtn : styles.archPrimaryBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  sound.play('pluck', { note: 69 });
                  sound.play('swish', { dir: 1 });
                  if (onSelectProject) {
                    onSelectProject(p.id);
                  } else if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-project-modal', { detail: p.id }));
                  }
                }}
                data-cursor="link"
                data-magnetic="0.3"
              >
                <span>Explore Architecture</span>
              </button>

              {p.githubUrl && (
                <a
                  href={p.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceTextLink}
                  onClick={(e) => e.stopPropagation()}
                  data-cursor="link"
                  data-magnetic="0.3"
                  title="View Source on GitHub"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  <span>Source</span>
                </a>
              )}
            </div>
          </div>

          <div
            ref={mediaRef}
            className={`${styles.tileMedia} media`}
            data-tile="media"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`${styles.previewToggleBtn} ${isRunning ? styles.previewToggleBtnActive : ''}`}
              onClick={togglePreview}
              aria-label={isRunning ? `Pause ${p.title} preview` : `Run ${p.title} preview`}
              data-cursor="link"
            >
              <span className={`${styles.previewDot} ${isRunning ? styles.previewDotActive : ''}`} aria-hidden="true" />
              <span>{isRunning ? 'Pause' : 'Run preview'}</span>
            </button>
            <div className={gradeClass}>
              <ProjectSimulator projectId={p.id} isRunning={isRunning} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.tileHeaderBar}>
            <span className={styles.typeChip}>{p.status}</span>
            <span className={styles.metricChip}>{p.perf}</span>
          </div>

          <div className={styles.tileBody}>
            <h2 className={styles.tileTitle}>{p.title}</h2>
            <div className={styles.tileSubtitle}>{subtitle}</div>
            <p className={styles.tileDescClamped}>{p.shortDescription}</p>

            <div className={styles.stackChips}>
              {p.tech.map((t) => (
                <span key={t} className={styles.stackPill}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div
            ref={mediaRef}
            className={`${styles.tileMedia} media`}
            data-tile="media"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`${styles.previewToggleBtn} ${isRunning ? styles.previewToggleBtnActive : ''}`}
              onClick={togglePreview}
              aria-label={isRunning ? `Pause ${p.title} preview` : `Run ${p.title} preview`}
              data-cursor="link"
            >
              <span className={`${styles.previewDot} ${isRunning ? styles.previewDotActive : ''}`} aria-hidden="true" />
              <span>{isRunning ? 'Pause' : 'Run preview'}</span>
            </button>
            <div className={gradeClass}>
              <ProjectSimulator projectId={p.id} isRunning={isRunning} />
            </div>
          </div>

          <div className={styles.tileActionsRow}>
            {p.liveUrl && (
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.amberPillBtn}
                onClick={(e) => e.stopPropagation()}
                data-cursor="link"
                data-magnetic="0.3"
              >
                <span>Visit Live Site</span>
              </a>
            )}

            <button
              type="button"
              className={p.liveUrl ? styles.archSecondaryBtn : styles.archPrimaryBtn}
              onClick={(e) => {
                e.stopPropagation();
                sound.play('pluck', { note: 69 });
                sound.play('swish', { dir: 1 });
                if (onSelectProject) {
                  onSelectProject(p.id);
                } else if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-project-modal', { detail: p.id }));
                }
              }}
              data-cursor="link"
              data-magnetic="0.3"
            >
              <span>Explore Architecture</span>
            </button>

            {p.githubUrl && (
              <a
                href={p.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceTextLink}
                onClick={(e) => e.stopPropagation()}
                data-cursor="link"
                data-magnetic="0.3"
                title="View Source on GitHub"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                <span>Source</span>
              </a>
            )}
          </div>
        </>
      )}
    </article>
  );
}

export function WorksPage({ onSelectProject }: WorksPageProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'Web App' | 'Tool' | 'Commercial'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('view_mode') as 'grid' | 'table') || 'grid';
    }
    return 'grid';
  });

  const viewContainerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const applyViewMode = useCallback((mode: 'grid' | 'table') => {
    const container = viewContainerRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!container || reduce) {
      setViewMode(mode);
      localStorage.setItem('view_mode', mode);
      return;
    }

    gsap.killTweensOf(container);
    gsap.to(container, {
      opacity: 0,
      duration: 0.1,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        setViewMode(mode);
        localStorage.setItem('view_mode', mode);
        gsap.fromTo(container, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power2.out', overwrite: true });
      },
    });
  }, []);

  const handleToggleView = useCallback(
    (mode: 'grid' | 'table') => {
      if (mode === viewMode) return;
      sound.play('swish', { vel: 0.5 });
      applyViewMode(mode);
      window.dispatchEvent(new CustomEvent('set-view-mode', { detail: mode }));
    },
    [viewMode, applyViewMode]
  );

  // Sync external view mode changes
  useEffect(() => {
    const handleView = (e: Event) => {
      const custom = e as CustomEvent<'grid' | 'table'>;
      if (custom.detail && custom.detail !== viewMode) {
        applyViewMode(custom.detail);
      }
    };
    window.addEventListener('set-view-mode', handleView);
    return () => window.removeEventListener('set-view-mode', handleView);
  }, [viewMode, applyViewMode]);

  // G and T keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        handleToggleView('grid');
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToggleView('table');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleView]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      'Web App': projects.filter((p) => p.categoryType === 'Web App').length,
      Tool: projects.filter((p) => p.categoryType === 'Tool').length,
      Commercial: projects.filter((p) => p.categoryType === 'Commercial').length,
    }),
    []
  );

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects;
    return projects.filter((p) => p.categoryType === activeFilter);
  }, [activeFilter]);

  const handleFilterClick = (filter: 'all' | 'Web App' | 'Tool' | 'Commercial') => {
    if (filter === activeFilter) return;
    sound.play('pluck', { note: 67, vel: 0.6 });

    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !gridContainerRef.current || viewMode !== 'grid') {
      setActiveFilter(filter);
      return;
    }

    const targets = gridContainerRef.current.querySelectorAll('[data-tile]');
    const state = targets.length > 0 ? Flip.getState(targets) : null;

    setActiveFilter(filter);

    requestAnimationFrame(() => {
      if (!state || !gridContainerRef.current) return;
      const currentTargets = gridContainerRef.current.querySelectorAll('[data-tile]');
      Flip.from(state, {
        targets: currentTargets,
        duration: 0.6,
        ease: 'power3.inOut',
        absolute: true,
        onEnter: (els) => {
          if (els && els.length > 0) {
            gsap.fromTo(
              els,
              { opacity: 0, scale: 0.95 },
              { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.inOut' }
            );
          }
        },
        onLeave: (els) => {
          if (els && els.length > 0) {
            gsap.to(els, {
              opacity: 0,
              scale: 0.95,
              duration: 0.6,
              ease: 'power3.inOut',
            });
          }
        },
      });
    });
  };

  return (
    <div className={`page ${styles.worksContainer}`}>
      <PageHeader
        title="Selected Works"
        intro="A showcase of real web applications, browser extensions, and practical desktop tools I have engineered."
      />

      {/* Row Under Header: Filter Chips on Left, Grid/Table Switch on Right */}
      <div className={styles.controlsBar}>
        <div className={styles.filterBar} role="group" aria-label="Filter projects by category">
          <button
            type="button"
            data-filter="all"
            className={`${styles.filterChip} ${activeFilter === 'all' ? styles.filterChipActive : ''}`}
            aria-pressed={activeFilter === 'all'}
            onClick={() => handleFilterClick('all')}
            data-cursor="link"
            data-magnetic="0.3"
          >
            <span>All</span>
            <span className={styles.filterCount}>{counts.all}</span>
          </button>

          <button
            type="button"
            data-filter="Web App"
            className={`${styles.filterChip} ${activeFilter === 'Web App' ? styles.filterChipActive : ''}`}
            aria-pressed={activeFilter === 'Web App'}
            onClick={() => handleFilterClick('Web App')}
            data-cursor="link"
            data-magnetic="0.3"
          >
            <span>Web Applications</span>
            <span className={styles.filterCount}>{counts['Web App']}</span>
          </button>

          <button
            type="button"
            data-filter="Tool"
            className={`${styles.filterChip} ${activeFilter === 'Tool' ? styles.filterChipActive : ''}`}
            aria-pressed={activeFilter === 'Tool'}
            onClick={() => handleFilterClick('Tool')}
            data-cursor="link"
            data-magnetic="0.3"
          >
            <span>Tools &amp; Extensions</span>
            <span className={styles.filterCount}>{counts.Tool}</span>
          </button>

          <button
            type="button"
            data-filter="Commercial"
            className={`${styles.filterChip} ${activeFilter === 'Commercial' ? styles.filterChipActive : ''}`}
            aria-pressed={activeFilter === 'Commercial'}
            onClick={() => handleFilterClick('Commercial')}
            data-cursor="link"
            data-magnetic="0.3"
          >
            <span>E-Commerce</span>
            <span className={styles.filterCount}>{counts.Commercial}</span>
          </button>
        </div>

        {/* View Mode Toggle: Grid [G] vs Table [T] */}
        <div className={styles.viewModeToggle} role="group" aria-label="Project view format">
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => handleToggleView('grid')}
            title="Switch to Bento Grid View [G]"
            aria-pressed={viewMode === 'grid'}
            data-cursor="link"
            data-magnetic="0.3"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Grid [G]</span>
          </button>

          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => handleToggleView('table')}
            title="Switch to Data Ledger Table [T]"
            aria-pressed={viewMode === 'table'}
            data-cursor="link"
            data-magnetic="0.3"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>Table [T]</span>
          </button>
        </div>
      </div>

      {/* Projects Showcase Container */}
      <div ref={viewContainerRef}>
        {viewMode === 'table' ? (
          <div className={styles.tableWrapper}>
            <ProjectLedger
              projects={filteredProjects}
              onSelectProject={(p) => onSelectProject?.(p.id)}
            />
          </div>
        ) : (
          <section aria-label="Selected Works Grid" className={styles.worksSection}>
            <div ref={gridContainerRef} className={`bento ${styles.bentoGrid}`}>
              {filteredProjects.map((p, i) => {
                const isFeatured = Boolean(p.featured ?? (p.id === 'purefeed' || p.id === 'doclensbd'));
                const spanClass = getSpanClass(p, activeFilter !== 'all', activeFilter);

                return (
                  <WorksProjectTile
                    key={p.id}
                    project={p}
                    index={i}
                    spanClass={spanClass}
                    isFeatured={isFeatured}
                    onSelectProject={onSelectProject}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

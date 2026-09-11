import { useState, useMemo, useEffect } from 'react';
import { SpotlightCard } from '../../components/SpotlightCard/SpotlightCard';
import { ProjectSimulator } from '../../components/ProjectSimulator/ProjectSimulator';
import { ScrambleText } from '../../components/ScrambleText/ScrambleText';
import { ProjectLedger } from '../../components/CaseStudy/ProjectLedger';
import { projects } from '../../data/projects';
import { sound } from '../../utils/audio';
import styles from './WorksPage.module.css';

interface WorksPageProps {
  onSelectProject?: (projectId: string) => void;
}

export function WorksPage({ onSelectProject }: WorksPageProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'Web App' | 'Tool' | 'Commercial'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('view_mode') as 'grid' | 'table') || 'grid';
    }
    return 'grid';
  });

  useEffect(() => {
    const handleView = (e: Event) => {
      const custom = e as CustomEvent<'grid' | 'table'>;
      if (custom.detail) {
        setViewMode(custom.detail);
        localStorage.setItem('view_mode', custom.detail);
      }
    };
    window.addEventListener('set-view-mode', handleView);
    return () => window.removeEventListener('set-view-mode', handleView);
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects;
    return projects.filter((p) => p.categoryType === activeFilter);
  }, [activeFilter]);

  const handleFilterClick = (filter: 'all' | 'Web App' | 'Tool' | 'Commercial') => {
    sound.playTick();
    setActiveFilter(filter);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.eyebrow}>Portfolio &amp; Case Studies</span>
        <h1 className={styles.title} data-cursor="inspect" data-cursor-label="PROJECTS">
          <ScrambleText text="Selected Works" />
        </h1>
        <p className={styles.subtitle}>
          A showcase of real web applications, browser extensions, and practical desktop tools I have engineered.
        </p>
      </header>

      {/* Controls Bar: Filter Pills + Grid/Table Toggle */}
      <div className={styles.controlsBar}>
        <div className={styles.filterBar}>
          <button
            type="button"
            className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => handleFilterClick('all')}
          >
            All Works ({projects.length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${activeFilter === 'Web App' ? styles.filterBtnActive : ''}`}
            onClick={() => handleFilterClick('Web App')}
          >
            Web Applications
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${activeFilter === 'Tool' ? styles.filterBtnActive : ''}`}
            onClick={() => handleFilterClick('Tool')}
          >
            Tools &amp; Extensions
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${activeFilter === 'Commercial' ? styles.filterBtnActive : ''}`}
            onClick={() => handleFilterClick('Commercial')}
          >
            E-Commerce
          </button>
        </div>

        {/* View Mode Toggle (Grid vs Table) */}
        <div className={styles.viewModeToggle} role="group" aria-label="View format">
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => {
              setViewMode('grid');
              window.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'grid' }));
              sound.playClick(650, 0.02, 0.06);
            }}
            title="Card Grid Mode [G]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
            onClick={() => {
              setViewMode('table');
              window.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'table' }));
              sound.playClick(720, 0.02, 0.06);
            }}
            title="Data Table Mode [T]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>Table [T]</span>
          </button>
        </div>
      </div>

      {/* Projects Showcase (Grid or Table) */}
      {viewMode === 'table' ? (
        <div className={styles.tableWrapper}>
          <ProjectLedger
            projects={filteredProjects}
            onSelectProject={(p) => onSelectProject?.(p.id)}
          />
        </div>
      ) : (
        <div className={styles.projectsGrid}>
        {filteredProjects.map((p) => {
          return (
            <SpotlightCard
              key={p.id}
              as="article"
              className={styles.projectCard}
              contentClassName={styles.projectCardContent}
              tiltIntensity={9}
            >
              {/* Precision Architectural Header */}
              <div className={styles.cardHeaderBar}>
                <div className={styles.headerLeft}>
                  <span className={styles.systemSerial}>{p.serial}</span>
                  <span className={styles.categoryBadge}>
                    <span className={styles.categoryDot} /> {p.category}
                  </span>
                </div>
                <div className={styles.beaconBadge}>
                  <span className={styles.beaconDot} />
                  <span>{p.status}</span>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.titleRow}>
                  <h2 className={styles.projectTitle}>{p.title}</h2>
                  <span className={styles.perfBadge}>{p.perf}</span>
                </div>
                <p className={styles.projectSummary}>{p.shortDescription}</p>
                <div className={styles.techStack}>
                  {p.tech.map((t) => (
                    <span key={t} className={styles.techTag}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.simulatorDeck}>
                <ProjectSimulator projectId={p.id} />
              </div>

              <div className={styles.cardActions}>
                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.primaryActionBtn}
                    onClick={() => sound.playTick()}
                    data-cursor="link"
                  >
                    <span>Visit Live Site</span>
                    <span className={styles.actionArrow}>&rarr;</span>
                  </a>
                )}

                <button
                  type="button"
                  className={p.liveUrl ? styles.secondaryActionBtn : styles.primaryActionBtn}
                  onClick={() => {
                    sound.playClick();
                    onSelectProject?.(p.id);
                  }}
                  data-cursor="link"
                >
                  <span>Explore Architecture</span>
                  {!p.liveUrl && <span className={styles.actionArrow}>&rarr;</span>}
                </button>

                {p.githubUrl && (
                  <a
                    href={p.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.secondaryActionBtn}
                    onClick={() => sound.playTick()}
                    data-cursor="link"
                    title="View Source on GitHub"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                    <span>Source</span>
                  </a>
                )}
              </div>
            </SpotlightCard>
          );
        })}
        </div>
      )}
    </div>
  );
}

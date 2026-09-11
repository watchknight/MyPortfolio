import { useState, useMemo, useEffect } from 'react';
import { SpotlightCard } from '../../components/SpotlightCard/SpotlightCard';
import { ProjectSimulator } from '../../components/ProjectSimulator/ProjectSimulator';
import { ScrambleText } from '../../components/ScrambleText/ScrambleText';
import { ProjectLedger } from '../../components/CaseStudy/ProjectLedger';
import { projects as richProjects } from '../../data/projects';
import { sound } from '../../utils/audio';
import styles from './WorksPage.module.css';

interface ProjectItem {
  id: string;
  title: string;
  category: 'Web App' | 'Tool' | 'Commercial';
  status: string;
  description: string;
  tech: string[];
  liveUrl?: string;
  githubUrl?: string;
}

const projects: ProjectItem[] = [
  {
    id: 'purefeed',
    title: 'PureFeed — YouTube Ad Countermeasure',
    category: 'Tool',
    status: 'Extension',
    description:
      'A browser extension that cleanly eliminates sponsored posts and YouTube video ads in under 16ms without slowing down page load or triggering ad-blocker warning banners.',
    tech: ['TypeScript', 'Chromium MV3', 'DOM Observers', 'Web APIs'],
    githubUrl: 'https://github.com/watchknight/purefeed',
  },
  {
    id: 'focusguard',
    title: 'FocusGuard — Distraction Blocker',
    category: 'Tool',
    status: 'Desktop App',
    description:
      'A desktop tool that blocks addictive websites at the operating-system level, helping students and professionals maintain deep focus without relying on flimsy browser plugins.',
    tech: ['C++', 'Windows Registry', 'DNS Sinkhole', 'Node.js'],
    githubUrl: 'https://github.com/watchknight/focusguard',
  },
  {
    id: 'doclensbd',
    title: 'DocLensBD — Eyewear Store with 3D Try-On',
    category: 'Web App',
    status: 'Live on Render',
    description:
      'A modern online glasses shop with an instant 3D webcam virtual try-on. Customers can see real-time frame fittings on their face using accurate face tracking at 60 FPS.',
    tech: ['React', 'MediaPipe 3D', 'Tailwind CSS', 'Node.js'],
    liveUrl: 'https://doclensbd.onrender.com/',
    githubUrl: 'https://github.com/watchknight/doclensbd',
  },
  {
    id: 'rannabanna',
    title: 'Rannabanna — Smart Bengali Recipe Matcher',
    category: 'Web App',
    status: 'Live on Render',
    description:
      'A web app that helps you discover delicious Bengali meals based on whatever vegetables, fish, and spices you currently have in your kitchen, with instant recipe scaling.',
    tech: ['React', 'Express', 'SQLite', 'Node.js'],
    liveUrl: 'https://rannabanna.onrender.com/',
    githubUrl: 'https://github.com/watchknight/rannabanna',
  },
  {
    id: 'poshra',
    title: 'POSHRA — Fashion Commerce Store',
    category: 'Commercial',
    status: 'Live on Render',
    description:
      'A fast, responsive clothing and lifestyle store featuring category filters, an intuitive cart drawer, and regional payment gateway integration.',
    tech: ['Next.js', 'React', 'Zod', 'SSLCommerz'],
    liveUrl: 'https://poshra.onrender.com/',
    githubUrl: 'https://github.com/watchknight/poshra',
  },
  {
    id: 'myportfolio',
    title: 'Portfolio Website',
    category: 'Web App',
    status: 'This Website',
    description:
      'A custom-built, lightweight personal portfolio with audio sound synthesis, dark/light themes, keyboard shortcuts, and zero unnecessary bloat.',
    tech: ['React', 'TypeScript', 'Vite', 'Web Audio API'],
    githubUrl: 'https://github.com/watchknight/MyPortfolio',
  },
];

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
    return projects.filter((p) => p.category === activeFilter);
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
            projects={richProjects}
            onSelectProject={(p) => onSelectProject?.(p.id)}
          />
        </div>
      ) : (
        <div className={styles.projectsGrid}>
        {filteredProjects.map((p) => {
          const projectMetaMap: Record<string, { serial: string; perf: string }> = {
            purefeed: { serial: 'SYS_01 // MV3', perf: '<16ms Latency' },
            focusguard: { serial: 'SYS_02 // OS_DNS', perf: '0.1ms Sinkhole' },
            doclensbd: { serial: 'SYS_03 // 3D_TRYON', perf: '60 FPS WebGL' },
            rannabanna: { serial: 'SYS_04 // RECIPE_AI', perf: '0.8ms Matchmaker' },
            poshra: { serial: 'SYS_05 // ECOM_STACK', perf: '100% Production' },
            portfolio: { serial: 'SYS_06 // DSP_ENGINE', perf: '0 Audio Libs' },
          };
          const meta = projectMetaMap[p.id] || { serial: 'SYS_SPEC', perf: 'Verified' };

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
                  <span className={styles.systemSerial}>{meta.serial}</span>
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
                  <span className={styles.perfBadge}>{meta.perf}</span>
                </div>
                <p className={styles.projectSummary}>{p.description}</p>
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

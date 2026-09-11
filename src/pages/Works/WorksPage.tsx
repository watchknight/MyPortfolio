import { useState, useMemo } from 'react';
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
        <h1 className={styles.title}>Selected Works</h1>
        <p className={styles.subtitle}>
          A showcase of real web applications, browser extensions, and practical desktop tools I have engineered.
        </p>
      </header>

      {/* Filter Bar */}
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

      {/* Projects Grid */}
      <div className={styles.projectsGrid}>
        {filteredProjects.map((p) => (
          <article key={p.id} className={styles.projectCard}>
            <div className={styles.cardHead}>
              <span className={styles.categoryTag}>{p.category}</span>
              <span className={styles.statusIndicator}>
                <span className={styles.statusDot} />
                <span>{p.status}</span>
              </span>
            </div>

            <div className={styles.cardContent}>
              <h2 className={styles.projectTitle}>{p.title}</h2>
              <p className={styles.projectSummary}>{p.description}</p>
              <div className={styles.techStack}>
                {p.tech.map((t) => (
                  <span key={t} className={styles.techTag}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.cardActions}>
              {p.liveUrl && (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.liveBtn}
                  onClick={() => sound.playTick()}
                >
                  <span>Visit Live</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}

              {p.githubUrl && (
                <a
                  href={p.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.detailBtn}
                  onClick={() => sound.playTick()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  <span>GitHub</span>
                </a>
              )}

              <button
                type="button"
                className={styles.detailBtn}
                onClick={() => {
                  sound.playClick();
                  onSelectProject?.(p.id);
                }}
              >
                <span>Read Overview &rarr;</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

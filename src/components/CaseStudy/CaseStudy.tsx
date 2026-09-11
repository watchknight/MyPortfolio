import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { projects, type ProjectData } from '../../data/projects';
import { SpotlightCard } from '../SpotlightCard/SpotlightCard';
import { ScrambleText } from '../ScrambleText/ScrambleText';
import { MechanicalCounter } from '../MechanicalCounter/MechanicalCounter';
import { ProjectLedger } from './ProjectLedger';
import { CaseStudyModal } from '../CaseStudyModal/CaseStudyModal';
import { sound } from '../../utils/audio';
import styles from './CaseStudy.module.css';

const CATEGORIES = [
  'All',
  'Browser Internals & Security',
  'Systems Engineering & Security',
  'Algorithms & Database Systems',
  'Computer Vision & Optical Frontend',
  'Full-Stack Architecture & Payments',
];

export function CaseStudies() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // Local like states for gallery cards
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

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.subtitle.toLowerCase().includes(query) ||
        p.problem.toLowerCase().includes(query) ||
        p.environment.some((env) => env.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    sound.playClick(700, 0.02, 0.05);
  };

  const toggleView = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    sound.playClick( mode === 'grid' ? 620 : 780, 0.03, 0.07);
  };

  return (
    <section className={styles.showcaseSection} id="engineering">
      <div className="container">
        {/* Header */}
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Primary Engineering &amp; Architecture</span>
          <h2 className={styles.sectionTitle}>
            <ScrambleText text="Curated Systems & Countermeasures" />
          </h2>
          <p className={styles.sectionDesc}>
            Dissected down to the AST code level. Browser extensions with Manifest V3 main-world bridges,
            machine-policy registry locks, non-linear cooking scaling engines, and real-time computer vision mesh.
          </p>
        </header>

        {/* Sticky Control Bar (Brian Lovin Craft) */}
        <div className={styles.controlBar} role="toolbar" aria-label="Project view and category controls">
          {/* Category Filter Pills */}
          <div className={styles.filterGroup}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'All'
                  ? projects.length
                  : projects.filter((p) => p.category.toLowerCase().includes(cat.toLowerCase())).length;

              const label =
                cat === 'All'
                  ? 'All'
                  : cat
                      .replace(' & ', ' ')
                      .split(' ')[0];

              return (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.filterPill} ${isSelected ? styles.filterPillActive : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                  data-cursor="link"
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeCategoryIndicator"
                      className={styles.filterIndicator}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span>{label}</span>
                  <span className={styles.filterCount}>[{count}]</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search + View Mode Switch */}
          <div className={styles.rightControls}>
            <div className={styles.searchBox}>
              <svg
                className={styles.searchIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Filter by stack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter projects by technology or title"
              />
            </div>

            <div className={styles.viewSwitcher}>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => toggleView('grid')}
                aria-label="Grid view"
                title="Bento Grid View"
                data-cursor="link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>

              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
                onClick={() => toggleView('table')}
                aria-label="Table ledger view"
                title="Data Ledger View"
                data-cursor="link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {filteredProjects.length === 0 ? (
          <div className={styles.emptyState}>
            No verified systems match your filter criteria. Try searching for &quot;React&quot;, &quot;Manifest V3&quot;, or &quot;Node.js&quot;.
          </div>
        ) : viewMode === 'table' ? (
          <ProjectLedger
            projects={filteredProjects}
            onSelectProject={(p) => setSelectedProject(p)}
          />
        ) : (
          <div className={styles.bentoGrid}>
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
                  <SpotlightCard className={styles.projectCard}>
                    <div className={styles.cardInner}>
                      {/* Top Bar */}
                      <div className={styles.cardTop}>
                        <span className={styles.domainBadge}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                          {project.domain}
                        </span>

                        <button
                          type="button"
                          className={`${styles.likeBtn} ${userLikedMap[project.id] ? styles.liked : ''}`}
                          onClick={(e) => handleLike(e, project.id)}
                          aria-label={`Like ${project.title}. Current count: ${likesMap[project.id] ?? project.likes}`}
                          data-cursor="link"
                        >
                          <svg viewBox="0 0 24 24" fill={userLikedMap[project.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          <MechanicalCounter value={likesMap[project.id] ?? project.likes} />
                        </button>
                      </div>

                      {/* Head */}
                      <div className={styles.cardHead}>
                        <h3 className={styles.projectTitle}>
                          <ScrambleText text={project.title} />
                        </h3>
                        <p className={styles.projectSubtitle}>{project.subtitle}</p>
                      </div>

                      {/* Key Metric Badge */}
                      <div className={styles.metricBadge}>
                        <span className={styles.metricVal}>{project.metric.value}</span>
                        <span className={styles.metricLab}>{project.metric.label}</span>
                      </div>

                      {/* Problem summary */}
                      <p className={styles.problemExcerpt}>{project.problem}</p>

                      {/* Stack Pills */}
                      <div className={styles.stackList}>
                        {project.environment.map((env) => (
                          <span key={env} className={styles.stackTag}>
                            {env}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className={styles.cardFooter}>
                        <button
                          type="button"
                          className={styles.inspectBtn}
                          onClick={() => {
                            sound.playDrawer();
                            setSelectedProject(project);
                          }}
                          data-cursor="inspect"
                          data-cursor-label="ANATOMY"
                        >
                          <span>Inspect Anatomy</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>

                        <a
                          href={project.repository}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.repoLink}
                          onClick={() => sound.playTick()}
                          data-cursor="link"
                        >
                          <span>Source</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Deep-Dive Case Study Modal / Drawer */}
      <CaseStudyModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}

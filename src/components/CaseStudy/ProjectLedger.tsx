import { useState, useMemo } from 'react';
import type { ProjectData } from '../../data/projects';
import { MechanicalCounter } from '../MechanicalCounter/MechanicalCounter';
import { sound } from '../../utils/audio';
import styles from './ProjectLedger.module.css';

interface ProjectLedgerProps {
  projects: ProjectData[];
  onSelectProject: (p: ProjectData) => void;
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

  return (
    <div className={styles.ledgerContainer} role="table" aria-label="System Projects Table">
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

      {sortedProjects.map((project: ProjectData) => (
        <div
          key={project.id}
          className={styles.ledgerRow}
          role="row"
          onClick={() => {
            sound.playDrawer();
            onSelectProject(project);
          }}
          data-cursor="inspect"
          data-cursor-label="INSPECT"
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
              data-cursor="inspect"
            >
              Inspect
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

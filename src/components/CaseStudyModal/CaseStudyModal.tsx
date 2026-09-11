import { useEffect, useRef, useState } from 'react';
import type { ProjectData } from '../../data/projects';
import { sound } from '../../utils/audio';
import { useScrollLock } from '../../utils/scrollLock';
import styles from './CaseStudyModal.module.css';

interface CaseStudyModalProps {
  project: ProjectData | null;
  onClose: () => void;
}

export function CaseStudyModal({ project, onClose }: CaseStudyModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'interventions' | 'code'>('architecture');
  const [copied, setCopied] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);

  useScrollLock(Boolean(project));

  if (project && project.id !== prevId) {
    setPrevId(project.id);
    setActiveTab('architecture');
    setCopied(false);
  }

  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playDrawer();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  const copyCode = () => {
    if (project.codeHighlight) {
      navigator.clipboard.writeText(project.codeHighlight.code);
      setCopied(true);
      sound.playChirp(600, 1000, 0.05, 0.06);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playDrawer();
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      data-lenis-prevent="true"
    >
      <div
        className={styles.sheet}
        ref={modalRef}
        tabIndex={-1}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.categoryTag}>{project.category}</span>
            <h3 className={styles.title} id="modal-project-title">
              {project.title}
            </h3>
            <p className={styles.subtitle}>{project.subtitle}</p>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => {
              sound.playDrawer();
              onClose();
            }}
            aria-label="Close case study (Esc)"
            title="Close (Esc)"
            data-cursor="link"
          >
            <span className={styles.closeKbd}>ESC</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabBar} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'architecture' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('architecture');
              sound.playClick(600, 0.02, 0.04);
            }}
            role="tab"
            aria-selected={activeTab === 'architecture'}
          >
            Anatomy &amp; Architecture
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'interventions' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('interventions');
              sound.playClick(700, 0.02, 0.04);
            }}
            role="tab"
            aria-selected={activeTab === 'interventions'}
          >
            Engineering Challenges [{project.interventions.length}]
          </button>

          {project.codeHighlight && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'code' ? styles.tabBtnActive : ''}`}
              onClick={() => {
                setActiveTab('code');
                sound.playClick(800, 0.02, 0.04);
              }}
              role="tab"
              aria-selected={activeTab === 'code'}
            >
              Code AST Sandbox
            </button>
          )}
        </div>

        {/* Content Body */}
        <div
          className={styles.contentBody}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
        >
          {activeTab === 'architecture' && (
            <>
              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>The Core Engineering Problem</h4>
                <p className={styles.sectionText}>{project.problem}</p>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>System Architecture &amp; State Design</h4>
                <p className={styles.sectionText}>{project.architecture}</p>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.sectionHeading}>Environment &amp; Stack Runtime</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {project.environment.map((env) => (
                    <span
                      key={env}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border-hairline)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {env}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'interventions' && (
            <div className={styles.interventionsList}>
              {project.interventions.map((item, idx) => (
                <div key={item.name} className={styles.interventionCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--color-accent)',
                        fontWeight: 700,
                      }}
                    >
                      CHALLENGE 0{idx + 1}
                    </span>
                  </div>
                  <h5 className={styles.interventionName}>{item.name}</h5>
                  <p className={styles.interventionDetail}>
                    <strong>Root Cause:</strong> {item.cause}
                  </p>
                  <p className={styles.interventionDetail}>
                    <strong>Engineered Resolution:</strong> {item.fix}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'code' && project.codeHighlight && (
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionHeading}>Implementation Snippet</h4>
              <p className={styles.sectionText}>{project.codeHighlight.explanation}</p>

              <div className={styles.codeBox}>
                <div className={styles.codeHeader}>
                  <span>{project.codeHighlight.filename}</span>
                  <button type="button" className={styles.copyBtn} onClick={copyCode}>
                    {copied ? 'Copied ✓' : 'Copy AST'}
                  </button>
                </div>
                <pre className={styles.codeContent}>
                  <code>{project.codeHighlight.code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            STATUS: PRODUCTION VERIFIED
          </span>

          <div className={styles.modalFooterActions}>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.liveAction}
                onClick={() => sound.playClick(850, 0.03, 0.08)}
                data-cursor="link"
                title={`Launch live deployment: ${project.liveUrl}`}
              >
                <span className={styles.liveDot} />
                <span>Launch Live Site</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}

            <a
              href={project.repository}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.primaryAction}
              onClick={() => sound.playTick()}
              data-cursor="link"
            >
              <span>GitHub Repo</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

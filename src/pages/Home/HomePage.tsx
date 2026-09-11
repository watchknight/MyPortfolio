import { useState, useEffect } from 'react';
import { SpotlightCard } from '../../components/SpotlightCard/SpotlightCard';
import { HeroSandbox } from '../../components/HeroSandbox/HeroSandbox';
import { ProjectSimulator } from '../../components/ProjectSimulator/ProjectSimulator';
import { SignatureCanvas } from '../../components/SignatureCanvas/SignatureCanvas';
import { ParticleText } from '../../components/ParticleText/ParticleText';
import { ScrambleText } from '../../components/ScrambleText/ScrambleText';
import { ProjectLedger } from '../../components/CaseStudy/ProjectLedger';
import { projects } from '../../data/projects';
import { sound } from '../../utils/audio';
import styles from './HomePage.module.css';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectProject?: (projectId: string) => void;
}

export function HomePage({ onNavigate, onSelectProject }: HomePageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('view_mode') as 'grid' | 'table') || 'grid';
    }
    return 'grid';
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  return (
    <div className={styles.homeContainer}>
      {/* 1. Interactive Hero */}
      <section className={styles.heroSection} aria-label="Introduction">
        <div className={styles.heroLeft}>
          <div className={styles.statusPill}>
            <span className={styles.statusDot} />
            <span>Available for Internships &amp; Projects</span>
          </div>

          <div className={styles.titleWrapper}>
            <ParticleText
              lines={[
                { text: 'Hi, This is Moayed. I build', highlight: false },
                { text: 'fast, reliable software.', highlight: true },
              ]}
              dataCursor="repel"
              dataCursorLabel="MAGNETIC"
            />
          </div>

          <p className={styles.lead}>
            I&apos;m a Computer Science student at East West University in Dhaka, Bangladesh.
            I specialize in building clean web applications, browser tools, and practical software
            that solves real everyday problems.
          </p>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                sound.playClick();
                onNavigate('/works');
              }}
            >
              <span>View My Works</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                sound.playClick();
                onNavigate('/contact');
              }}
            >
              <span>Get in Touch</span>
            </button>

            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryBtn}
              onClick={() => sound.playTick()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download Résumé</span>
            </a>
          </div>
        </div>

        <div className={styles.heroRight}>
          <HeroSandbox onNavigate={onNavigate} />
        </div>

        {/* Tactical Scroll Explorer Prompt */}
        <div
          className={`${styles.scrollIndicator} ${scrolled ? styles.scrollIndicatorHidden : ''}`}
          onClick={() => {
            document.getElementById('featured-work')?.scrollIntoView({ behavior: 'smooth' });
            sound.playTick();
          }}
          role="button"
          tabIndex={0}
          aria-label="Scroll to featured work"
          data-cursor="link"
        >
          <span className={styles.scrollText}>Scroll to explore</span>
          <svg
            className={styles.scrollArrow}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* 2. Featured Projects (Only 2 top highlights, clean & simple) */}
      <section id="featured-work" className={styles.section} aria-label="Featured Projects">
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className={styles.sectionEyebrow}>Selected Projects</span>
            <h2 className={styles.sectionTitle} data-cursor="inspect" data-cursor-label="PROJECTS">
              <ScrambleText text="Featured Work" />
            </h2>
          </div>

          <div className={styles.headerRightControls}>
            {/* View Mode Switcher */}
            <div className={styles.viewModeToggle} role="group" aria-label="View format">
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => {
                  setViewMode('grid');
                  window.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'grid' }));
                  sound.playClick(650, 0.02, 0.06);
                }}
                title="Switch to 3D Card Grid [G]"
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
                title="Switch to Data Ledger Table [T]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span>Table [T]</span>
              </button>
            </div>

            <button
              type="button"
              className={styles.viewAllLink}
              onClick={() => {
                sound.playTick();
                onNavigate('/works');
              }}
            >
              <span>View all 6 projects</span>
              <span>&rarr;</span>
            </button>
          </div>
        </header>

        {viewMode === 'table' ? (
          <div className={styles.tableWrapper}>
            <ProjectLedger
              projects={projects}
              onSelectProject={(p) => onSelectProject?.(p.id)}
            />
          </div>
        ) : (
          <div className={styles.featuredGrid}>
          {projects
            .filter((p) => p.id === 'purefeed' || p.id === 'doclensbd')
            .map((p) => (
              <SpotlightCard
                key={p.id}
                as="article"
                className={styles.featuredCard}
                contentClassName={styles.featuredCardContent}
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

                <div className={styles.cardBody}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.cardTitle}>{p.title}</h3>
                    <span className={styles.perfBadge}>{p.perf}</span>
                  </div>
                  <p className={styles.cardDescription}>{p.shortDescription}</p>
                  <div className={styles.techList}>
                    {p.tech.map((t) => (
                      <span key={t} className={styles.techPill}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.simulatorDeck}>
                  <ProjectSimulator projectId={p.id} />
                </div>

                <div className={styles.cardFooter}>
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
                      if (onSelectProject) {
                        onSelectProject(p.id);
                      } else {
                        onNavigate('/works');
                      }
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
            ))}
        </div>
      )}
      </section>

      {/* 3. Background & Education Teaser */}
      <section className={styles.section} aria-label="Education & Background">
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className={styles.sectionEyebrow}>Academic Record</span>
            <h2 className={styles.sectionTitle} data-cursor="inspect" data-cursor-label="ACADEMICS">
              <ScrambleText text="Education & Background" />
            </h2>
          </div>
          <button
            type="button"
            className={styles.viewAllLink}
            onClick={() => {
              sound.playTick();
              onNavigate('/foundation');
            }}
          >
            <span>See full education timeline</span>
            <span>&rarr;</span>
          </button>
        </header>

        <SpotlightCard
          className={styles.storyCard}
          contentClassName={styles.storyCardContent}
          tiltIntensity={5}
        >
          <div className={styles.storyContent}>
            <p className={styles.storyParagraph}>
              I am currently pursuing my <strong>Bachelor of Science in Computer Science &amp; Engineering</strong> at{' '}
              <strong>East West University (EWU)</strong> in Dhaka, Bangladesh.
            </p>
            <p className={styles.storyParagraph}>
              Throughout school and college, I built a strong foundation in algorithms, mathematics, and systems.
              I earned National Board General Merit Scholarships for both my Class 8 (JSC) and Class 10 (SSC) board examinations.
            </p>
            <button
              type="button"
              className={styles.viewAllLink}
              style={{ width: 'fit-content', marginTop: '0.5rem' }}
              onClick={() => {
                sound.playTick();
                onNavigate('/foundation');
              }}
            >
              <span>Explore my skills &amp; coursework &rarr;</span>
            </button>
          </div>

          <div className={styles.highlightsList}>
            <div className={styles.highlightItem}>
              <span className={styles.checkIcon}>✓</span>
              <span><strong>East West University</strong> — B.Sc. CSE (2025—Present)</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.checkIcon}>✓</span>
              <span><strong>Board General Merit Scholarship</strong> — SSC Class 10 (GPA 5.0)</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.checkIcon}>✓</span>
              <span><strong>Board General Merit Scholarship</strong> — JSC Class 8 (GPA 5.0)</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.checkIcon}>✓</span>
              <span><strong>National Board Distinction</strong> — PSC Class 5 (GPA 5.0)</span>
            </div>
          </div>
        </SpotlightCard>
      </section>

      {/* 4. Interactive Visitor Guestbook Canvas */}
      <section className={styles.section} aria-label="Digital Guestbook">
        <SignatureCanvas />
      </section>

      {/* 5. Simple Contact Invite */}
      <section className={styles.contactStrip} aria-label="Get in touch">
        <h2 className={styles.contactHeadline}>Interested in working together?</h2>
        <p className={styles.contactSubtext}>
          I&apos;m currently open for software engineering internships and freelance web projects.
          Feel free to reach out anytime.
        </p>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => {
            sound.playClick();
            onNavigate('/contact');
          }}
        >
          <span>Send me a message &rarr;</span>
        </button>
      </section>
    </div>
  );
}

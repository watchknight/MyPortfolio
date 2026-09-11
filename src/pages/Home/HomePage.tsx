import { SpotlightCard } from '../../components/SpotlightCard/SpotlightCard';
import { HeroSandbox } from '../../components/HeroSandbox/HeroSandbox';
import { ProjectSimulator } from '../../components/ProjectSimulator/ProjectSimulator';
import { SignatureCanvas } from '../../components/SignatureCanvas/SignatureCanvas';
import { ScrambleText } from '../../components/ScrambleText/ScrambleText';
import { sound } from '../../utils/audio';
import styles from './HomePage.module.css';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectProject?: (projectId: string) => void;
}

export function HomePage({ onNavigate, onSelectProject }: HomePageProps) {
  return (
    <div className={styles.homeContainer}>
      {/* 1. Interactive Hero */}
      <section className={styles.heroSection} aria-label="Introduction">
        <div className={styles.heroLeft}>
          <div className={styles.statusPill}>
            <span className={styles.statusDot} />
            <span>Available for Internships &amp; Projects</span>
          </div>

          <h1 className={styles.title}>
            <span className={styles.titleLine}>
              <ScrambleText
                text="Hi, This is Moayed. I build"
                data-cursor="inspect"
                data-cursor-label="MOAYED"
              />
            </span>
            <span className={`${styles.titleLine} ${styles.highlight}`}>
              <ScrambleText
                text="fast, reliable software."
                data-cursor="inspect"
                data-cursor-label="CRAFT"
              />
            </span>
          </h1>

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
      </section>

      {/* 2. Featured Projects (Only 2 top highlights, clean & simple) */}
      <section className={styles.section} aria-label="Featured Projects">
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className={styles.sectionEyebrow}>Selected Projects</span>
            <h2 className={styles.sectionTitle} data-cursor="inspect" data-cursor-label="PROJECTS">
              <ScrambleText text="Featured Work" />
            </h2>
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
        </header>

        <div className={styles.featuredGrid}>
          {/* Featured Project 1: PureFeed */}
          <SpotlightCard
            as="article"
            className={styles.featuredCard}
            contentClassName={styles.featuredCardContent}
            tiltIntensity={9}
          >
            <div className={styles.cardMeta}>
              <span className={styles.categoryTag}>Browser Tool</span>
              <span className={styles.liveBadge}>Tested on YouTube</span>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>PureFeed</h3>
              <p className={styles.cardDescription}>
                A lightweight browser extension that removes video ads and sponsored recommendations
                on YouTube smoothly, without slowing down your browser or breaking video playback.
              </p>
              <div className={styles.techList}>
                <span className={styles.techPill}>TypeScript</span>
                <span className={styles.techPill}>Chromium MV3</span>
                <span className={styles.techPill}>DOM Observers</span>
              </div>
            </div>

            <ProjectSimulator projectId="purefeed" />

            <button
              type="button"
              className={styles.cardAction}
              onClick={() => {
                sound.playClick();
                if (onSelectProject) {
                  onSelectProject('purefeed');
                } else {
                  onNavigate('/works');
                }
              }}
            >
              <span>Learn how it works &rarr;</span>
            </button>
          </SpotlightCard>

          {/* Featured Project 2: DocLensBD */}
          <SpotlightCard
            as="article"
            className={styles.featuredCard}
            contentClassName={styles.featuredCardContent}
            tiltIntensity={9}
          >
            <div className={styles.cardMeta}>
              <span className={styles.categoryTag}>Web Application</span>
              <span className={styles.liveBadge}>Live on Render</span>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>DocLensBD</h3>
              <p className={styles.cardDescription}>
                An online eyewear store with a real-time 3D virtual try-on feature. Customers can
                preview prescription frames directly on their face using their webcam.
              </p>
              <div className={styles.techList}>
                <span className={styles.techPill}>React</span>
                <span className={styles.techPill}>MediaPipe 3D</span>
                <span className={styles.techPill}>Node.js</span>
              </div>
            </div>

            <ProjectSimulator projectId="doclensbd" />

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a
                href="https://doclensbd.onrender.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cardAction}
                onClick={() => sound.playTick()}
              >
                <span>Visit live site &rarr;</span>
              </a>
              <button
                type="button"
                className={styles.cardAction}
                style={{ color: 'var(--color-text-secondary)' }}
                onClick={() => {
                  sound.playClick();
                  if (onSelectProject) {
                    onSelectProject('doclensbd');
                  } else {
                    onNavigate('/works');
                  }
                }}
              >
                <span>Details</span>
              </button>
            </div>
          </SpotlightCard>
        </div>
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

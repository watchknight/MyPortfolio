import { SpotlightCard } from '../SpotlightCard/SpotlightCard';
import { ScrambleText } from '../ScrambleText/ScrambleText';
import styles from './Foundation.module.css';

const competencies = [
  {
    label: 'Browser Architecture',
    domain: 'Chromium MV3 / Blink',
    value:
      'Chromium Manifest V3, Content Security Policy handling, isolated vs. main world bridging, DOM mutation deduplication engines.',
  },
  {
    label: 'Systems & Networking',
    domain: 'OS Policies / DNS',
    value:
      'Operating-system hosts file manipulation, Windows Registry machine policy enforcement, DNS sinkholing, declarativeNetRequest rules.',
  },
  {
    label: 'Frontend Development',
    domain: 'React 19 / TypeScript',
    value:
      'React, TypeScript, HTML5 media lifecycle, responsive CSS architecture, state machines (Zustand), 6DOF face mesh rendering.',
  },
  {
    label: 'Backend & Algorithms',
    domain: 'Node / PostgreSQL / SQLite',
    value:
      'Node.js, Express, Next.js App Router, SQLite schema optimization, REST APIs, tiered caching architectures, LLM API integration.',
  },
];

const coursework = [
  'Data Structures & Algorithms',
  'Operating Systems & Kernels',
  'Computer Networks & Protocols',
  'Database Management Systems',
  'Discrete Mathematics',
  'Theory of Computation',
  'Software Architecture & Design',
  'Microprocessors & Assembly',
];

export function Foundation() {
  return (
    <section className={styles.section} id="foundation">
      <div className="container">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Academic Record &amp; Systems Rigor</span>
          <h2 className={styles.sectionTitle}>
            <ScrambleText text="Engineering Foundation" />
          </h2>
        </header>

        <div className={styles.columns}>
          {/* Left Column: Academic Record & Merit */}
          <SpotlightCard>
            <div className={styles.academicCard}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>Undergraduate Studies</h3>
                <span className={styles.gpaBadge}>GPA 5.0 / 5.0</span>
              </div>

              <div className={styles.eduItem}>
                <p className={styles.institution}>East West University</p>
                <p className={styles.degree}>
                  Bachelor of Science in Computer Science &amp; Engineering
                </p>
                <p className={styles.degree}>
                  Second Year — Dhaka, Bangladesh
                </p>
              </div>

              <div className={styles.scholarshipList}>
                <div className={styles.scholarshipItem}>
                  <div className={styles.scholarshipBullet} />
                  <span>
                    <strong>Government Talent-Pool Merit Scholarships:</strong> Awarded in Class 8 and Class 10 for verified top-tier academic ranking.
                  </span>
                </div>
                <div className={styles.scholarshipItem}>
                  <div className={styles.scholarshipBullet} />
                  <span>
                    <strong>Unbroken Distinction:</strong> Maintained consistent GPA 5.0 across Class 5, Class 8, and Class 10 national board examinations.
                  </span>
                </div>
              </div>

              <div className={styles.courseworkSection}>
                <span className={styles.courseworkLabel}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  Rigorous CS Coursework &amp; Theory
                </span>
                <div className={styles.courseworkTags}>
                  {coursework.map((c) => (
                    <span key={c} className={styles.courseworkTag}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Right Column: Core Competencies */}
          <div className={styles.competenciesGrid}>
            {competencies.map((comp) => (
              <div key={comp.label} className={styles.competencyCard}>
                <div className={styles.compLabel}>
                  <span>{comp.label}</span>
                  <span className={styles.compDomain}>{comp.domain}</span>
                </div>
                <p className={styles.compValue}>{comp.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { SpotlightCard } from '../SpotlightCard/SpotlightCard';
import { ScrambleText } from '../ScrambleText/ScrambleText';
import { sound } from '../../utils/audio';
import styles from './Foundation.module.css';

interface Milestone {
  year: string;
  title: string;
  institution: string;
  gradeBadge?: string;
  honorBadge?: string;
  description: string;
  active?: boolean;
}

const academicMilestones: Milestone[] = [
  {
    year: '2025 — Present',
    title: 'B.Sc. in Computer Science & Engineering',
    institution: 'East West University (EWU) — Dhaka, Bangladesh',
    honorBadge: 'Undergrad Scholar',
    description:
      'Undergraduate study focused on Systems Architecture, Operating Systems, Browser Internals, and Low-overhead Network Engineering.',
    active: true,
  },
  {
    year: '2023',
    title: 'Higher Secondary Certificate (HSC)',
    institution: 'Intermediate (Science Division)',
    honorBadge: 'Pre-Engineering Science',
    description:
      'Advanced physics, higher mathematics, and algorithmic computing foundation with national board completion.',
  },
  {
    year: '2021',
    title: 'Secondary School Certificate (SSC / Class 10)',
    institution: 'National Board of Education, Bangladesh',
    gradeBadge: 'GPA 5.0 / 5.0',
    honorBadge: 'General Scholarship',
    description:
      'Awarded Board General Merit Scholarship and verified perfect 5.0 grading across all subjects.',
  },
  {
    year: '2018',
    title: 'Junior School Certificate (JSC / Class 8)',
    institution: 'National Board of Education, Bangladesh',
    gradeBadge: 'GPA 5.0 / 5.0',
    honorBadge: 'General Scholarship',
    description:
      'Awarded Board General Merit Scholarship for verified academic excellence across regional schools.',
  },
  {
    year: '2015',
    title: 'Primary School Certificate (PSC / Class 5)',
    institution: 'National Board of Education, Bangladesh',
    gradeBadge: 'GPA 5.0 / 5.0',
    honorBadge: 'Board Distinction',
    description:
      'First national board distinction with verified perfect GPA 5.0 grading.',
  },
];

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
          {/* Left Column: 10-Year Academic Milestone Chronology */}
          <SpotlightCard>
            <div className={styles.academicCard}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>Academic Chronology</h3>
                <span className={styles.timelineDecadeBadge}>2015 — 2025+ Track</span>
              </div>

              <div className={styles.timelineContainer} role="feed" aria-label="Academic Milestones 2015 to Present">
                <div className={styles.timelineTrack} />

                {academicMilestones.map((m) => (
                  <div
                    key={m.year}
                    className={styles.milestoneItem}
                    onMouseEnter={() => sound.playTick()}
                  >
                    <span className={`${styles.timelineNode} ${m.active ? styles.timelineNodeActive : ''}`} />

                    <div className={styles.milestoneHeader}>
                      <span className={`${styles.milestoneYear} ${m.active ? styles.milestoneYearActive : ''}`}>
                        {m.year}
                      </span>
                      <div className={styles.milestoneBadges}>
                        {m.gradeBadge && <span className={styles.milestoneBadge}>{m.gradeBadge}</span>}
                        {m.honorBadge && <span className={styles.milestoneBadgeHonor}>{m.honorBadge}</span>}
                      </div>
                    </div>

                    <div className={styles.milestoneTitle}>{m.title}</div>
                    <div className={styles.milestoneInst}>{m.institution}</div>
                    <div className={styles.milestoneDesc}>{m.description}</div>
                  </div>
                ))}
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
              <div key={comp.label} className={styles.competencyCard} onMouseEnter={() => sound.playTick()}>
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

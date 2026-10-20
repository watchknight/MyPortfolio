import { useEffect, useRef } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { DeveloperASTCard } from '../../components/DeveloperAST/DeveloperASTCard';
import { initTimeline } from '../../motion/timeline';
import styles from './FoundationPage.module.css';

interface Milestone {
  year: string;
  title: string;
  institution: string;
  gradeBadge?: string;
  honorBadge?: string;
  description: string;
  primary?: boolean;
}

const academicMilestones: Milestone[] = [
  {
    year: '2025 — Present',
    title: 'B.Sc. in Computer Science & Engineering',
    institution: 'East West University (EWU) — Dhaka, Bangladesh',
    honorBadge: 'Undergrad Scholar',
    description:
      'Pursuing core engineering studies with an emphasis on Data Structures, Operating Systems, Computer Networks, and Web Technologies.',
    primary: true,
  },
  {
    year: '2023',
    title: 'Higher Secondary Certificate (HSC)',
    institution: 'Intermediate (Science Division)',
    honorBadge: 'Pre-Engineering Science',
    description:
      'Completed higher secondary education in advanced physics, chemistry, and higher mathematics under the national education curriculum.',
  },
  {
    year: '2021',
    title: 'Secondary School Certificate (SSC / Class 10)',
    institution: 'National Board of Education, Bangladesh',
    gradeBadge: 'GPA 5.0 / 5.0',
    honorBadge: 'General Scholarship',
    description:
      'Awarded the National Board General Merit Scholarship and achieved a perfect GPA 5.0 across all subjects.',
  },
  {
    year: '2018',
    title: 'Junior School Certificate (JSC / Class 8)',
    institution: 'National Board of Education, Bangladesh',
    gradeBadge: 'GPA 5.0 / 5.0',
    honorBadge: 'General Scholarship',
    description:
      'Awarded the National Board General Merit Scholarship and achieved a perfect GPA 5.0 across all subjects.',
  },
  {
    year: '2015',
    title: 'Primary School Certificate (PSC / Class 5)',
    institution: 'National Board of Education, Bangladesh',
    gradeBadge: 'GPA 5.0 / 5.0',
    honorBadge: 'Board Distinction',
    description:
      'Achieved a perfect GPA 5.0 with verified National Board Distinction.',
  },
];

const coursework = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Computer Networks',
  'Database Management Systems',
  'Discrete Mathematics',
  'Software Engineering & Design',
  'Object-Oriented Programming',
  'Theory of Computation',
];

const programmingLanguages = [
  'JavaScript (ES6+)',
  'TypeScript',
  'Python',
  'C / C++',
  'HTML5 / CSS3',
  'SQL',
];

const frontendSkills = [
  'React',
  'Next.js',
  'CSS Modules',
  'Tailwind CSS',
  'Responsive Layouts',
  'State Management',
];

const backendSkills = [
  'Node.js',
  'Express',
  'PostgreSQL',
  'SQLite',
  'RESTful APIs',
  'Authentication',
];

const toolsPractices = [
  'Git & GitHub',
  'Linux / Bash',
  'Browser Extensions',
  'Web Performance',
  'Clean Code',
];

export function FoundationPage() {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineRef.current) {
      return initTimeline(timelineRef.current);
    }
  }, []);

  return (
    <div className={`page ${styles.container}`}>
      <PageHeader
        title="Background & Skills"
        intro="My academic foundation at East West University, national board scholarship distinctions, and technical skills."
      />

      <div className={`bento ${styles.bentoGrid}`}>
        {/* Timeline Tile: span-7 rows-9 (surface) */}
        <article
          className={`${styles.tile} ${styles.tileFeatured} ${styles.timelineTile} span-7 rows-9`}
          data-tile="surface"
          data-cursor="inspect"
          data-degree="0"
          aria-label="Academic Timeline"
        >
          <h2 className={styles.tileTitle}>Academic timeline</h2>

          <div ref={timelineRef} className={`timeline ${styles.timelineWrapper}`}>
            <div data-timeline-line="" />
            {academicMilestones.map((m) => (
              <article
                key={m.year + m.title}
                data-timeline-item=""
                {...(m.primary ? { 'data-primary': '' } : {})}
                className={styles.timelineItem}
              >
                <div className={`timeline__year ${styles.timelineYear}`}>{m.year}</div>
                <h3 className={styles.itemTitle}>{m.title}</h3>
                <div className={styles.itemInst}>{m.institution}</div>
                <div className={styles.badgeGroup}>
                  {m.honorBadge && (
                    <span className={m.primary ? styles.chipPrimary : styles.chipScholar}>
                      {m.honorBadge}
                    </span>
                  )}
                  {m.gradeBadge && <span className={styles.chipGrade}>{m.gradeBadge}</span>}
                </div>
                <p className={styles.itemDesc}>{m.description}</p>
              </article>
            ))}
          </div>
        </article>

        {/* Right Column: Core Coursework (rows-3) */}
        <article
          className={`${styles.tile} ${styles.courseworkTile} span-5 rows-3`}
          data-tile="surface"
          data-cursor="inspect"
          data-degree="1"
          aria-label="Core Coursework"
        >
          <h2 className={styles.tileTitle}>Core coursework</h2>
          <div className={styles.pillCloud}>
            {coursework.map((c) => (
              <span key={c} className={styles.pill}>
                {c}
              </span>
            ))}
          </div>
        </article>

        {/* Right Column: Programming Languages (rows-2) */}
        <article
          className={`${styles.tile} ${styles.languagesTile} span-5 rows-2`}
          data-tile="surface"
          data-cursor="inspect"
          data-degree="2"
          aria-label="Programming Languages"
        >
          <h2 className={styles.tileTitle}>Programming languages</h2>
          <div className={styles.pillCloud}>
            {programmingLanguages.map((lang) => (
              <span key={lang} className={styles.pill}>
                {lang}
              </span>
            ))}
          </div>
        </article>

        {/* Right Column: Frontend & UI Engineering (rows-2) */}
        <article
          className={`${styles.tile} ${styles.frontendTile} span-5 rows-2`}
          data-tile="surface"
          data-cursor="inspect"
          data-degree="3"
          aria-label="Frontend & UI Engineering"
        >
          <h2 className={styles.tileTitle}>Frontend &amp; UI engineering</h2>
          <div className={styles.pillCloud}>
            {frontendSkills.map((s) => (
              <span key={s} className={styles.pill}>
                {s}
              </span>
            ))}
          </div>
        </article>

        {/* Right Column: Backend & Data (rows-2) */}
        <article
          className={`${styles.tile} ${styles.backendTile} span-5 rows-2`}
          data-tile="surface"
          data-cursor="inspect"
          data-degree="4"
          aria-label="Backend & Data"
        >
          <h2 className={styles.tileTitle}>Backend &amp; data</h2>
          <div className={styles.pillCloud}>
            {backendSkills.map((s) => (
              <span key={s} className={styles.pill}>
                {s}
              </span>
            ))}
          </div>
        </article>

        {/* Tools & Practices: span-12 rows-2 */}
        <article
          className={`${styles.tile} ${styles.toolsTile} span-12 rows-2`}
          data-tile="surface"
          data-cursor="inspect"
          data-degree="5"
          aria-label="Tools & Practices"
        >
          <h2 className={styles.tileTitle}>Tools &amp; practices</h2>
          <div className={styles.pillCloud}>
            {toolsPractices.map((t) => (
              <span key={t} className={styles.pill}>
                {t}
              </span>
            ))}
          </div>
        </article>

        {/* Developer Profile Manifest: span-12 rows-5 */}
        <DeveloperASTCard className={`${styles.manifestTile} span-12 rows-5`} />
      </div>
    </div>
  );
}

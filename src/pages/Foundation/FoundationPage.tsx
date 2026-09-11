import { SpotlightCard } from '../../components/SpotlightCard/SpotlightCard';
import { sound } from '../../utils/audio';
import { DeveloperASTCard } from '../../components/DeveloperAST/DeveloperASTCard';
import { ScrambleText } from '../../components/ScrambleText/ScrambleText';
import styles from './FoundationPage.module.css';

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
      'Pursuing core engineering studies with an emphasis on Data Structures, Operating Systems, Computer Networks, and Web Technologies.',
    active: true,
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

const skillCategories = [
  {
    title: 'Programming Languages',
    skills: ['JavaScript (ES6+)', 'TypeScript', 'Python', 'C / C++', 'HTML5 / CSS3', 'SQL'],
  },
  {
    title: 'Frontend & UI Engineering',
    skills: ['React', 'Next.js', 'CSS Modules', 'Tailwind CSS', 'Responsive Layouts', 'State Management'],
  },
  {
    title: 'Backend & Data',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'SQLite', 'RESTful APIs', 'Authentication'],
  },
  {
    title: 'Tools & Practices',
    skills: ['Git & GitHub', 'Linux / Bash', 'Browser Extensions', 'Web Performance', 'Clean Code'],
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

export function FoundationPage() {
  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.eyebrow}>Education &amp; Credentials</span>
        <h1 className={styles.title} data-cursor="inspect" data-cursor-label="ACADEMICS">
          <ScrambleText text="Background & Skills" />
        </h1>
        <p className={styles.subtitle}>
          My academic foundation at East West University, national board scholarship distinctions, and technical skills.
        </p>
      </header>

      {/* Two Column Layout */}
      <div className={styles.twoColumns}>
        {/* Left Column: Academic Chronology */}
        <SpotlightCard
          as="section"
          className={styles.card}
          contentClassName={styles.cardContent}
          tiltIntensity={4}
          aria-label="Academic Timeline"
        >
          <h2 className={styles.cardTitle}>Academic Timeline</h2>

          <div className={styles.timeline}>
            {academicMilestones.map((m) => (
              <div
                key={m.year}
                className={styles.timelineItem}
                onMouseEnter={() => sound.playTick()}
              >
                <span className={`${styles.timelineDot} ${m.active ? styles.timelineDotActive : ''}`} />

                <div className={styles.yearRow}>
                  <span className={styles.year}>{m.year}</span>
                  <div className={styles.badgeGroup}>
                    {m.gradeBadge && <span className={styles.badge}>{m.gradeBadge}</span>}
                    {m.honorBadge && <span className={styles.badgeScholar}>{m.honorBadge}</span>}
                  </div>
                </div>

                <div className={styles.itemTitle}>{m.title}</div>
                <div className={styles.itemInst}>{m.institution}</div>
                <div className={styles.itemDesc}>{m.description}</div>
              </div>
            ))}
          </div>

          <div className={styles.courseworkBlock}>
            <span className={styles.courseworkLabel}>Core Coursework &amp; Theory</span>
            <div className={styles.courseworkTags}>
              {coursework.map((c) => (
                <span key={c} className={styles.courseTag}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </SpotlightCard>

        {/* Right Column: Skills */}
        <section className={styles.skillsColumn} aria-label="Technical Skills">
          {skillCategories.map((cat) => (
            <SpotlightCard
              key={cat.title}
              className={styles.skillCategory}
              contentClassName={styles.skillCategoryContent}
              tiltIntensity={6}
              onMouseEnter={() => sound.playTick()}
            >
              <h2 className={styles.catTitle}>{cat.title}</h2>
              <div className={styles.skillPills}>
                {cat.skills.map((s) => (
                  <span key={s} className={styles.skillPill}>
                    {s}
                  </span>
                ))}
              </div>
            </SpotlightCard>
          ))}
        </section>
      </div>

      {/* Developer AST Schema */}
      <section className={styles.schemaSection} aria-label="Developer Schema">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span className={styles.eyebrow}>Developer Profile Manifest</span>
          <h2 className={styles.title} style={{ fontSize: '1.4rem' }}>TypeScript Schema</h2>
        </div>
        <DeveloperASTCard />
      </section>
    </div>
  );
}

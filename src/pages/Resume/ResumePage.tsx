import { useState, useRef, useEffect } from 'react';
import { RollText } from '../../components/RollText/RollText';
import { Magnetic } from '../../components/Magnetic/Magnetic';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { sound } from '../../audio/sound.js';
import { profileData } from '../../data/profile';
import { copyToClipboard } from '../../utils/clipboard';
import styles from './ResumePage.module.css';

export function ResumePage() {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyEmail = async () => {
    await copyToClipboard(profileData.contact.email);
    setCopied(true);
    sound.play('chime');

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copyTimeoutRef.current = null;
    }, 1600);
  };

  return (
    <div className={`page ${styles.pageContainer}`}>
      <div data-print="hide">
        <PageHeader
          title="Curriculum Vitae"
          intro="Verified engineering credentials, academic honors at East West University, production software projects, and technical skills."
        />
      </div>

      <div className={`${styles.resumeLayout} resume-layout`}>
        {/* Sticky Actions Rail */}
        <aside
          className={`${styles.resumeRail} resume-rail`}
          data-tile="surface"
          data-degree="0"
          data-print="hide"
          aria-label="Résumé actions and navigation"
        >
          <div className={styles.railActions}>
            <Magnetic strength={0.25}>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryAction}
                data-cursor="link"
                data-magnetic="0.25"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <RollText>Download PDF</RollText>
              </a>
            </Magnetic>

            <Magnetic strength={0.25}>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={handlePrint}
                data-cursor="link"
                data-magnetic="0.25"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <RollText>Print Résumé</RollText>
              </button>
            </Magnetic>

            <Magnetic strength={0.25}>
              <button
                type="button"
                className={`${styles.copyAction} ${copied ? styles.copied : ''}`}
                onClick={handleCopyEmail}
                data-cursor="link"
                data-magnetic="0.25"
                aria-live="polite"
              >
                {copied ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
                <span>{copied ? 'Email copied' : 'Copy email'}</span>
              </button>
            </Magnetic>
          </div>

          <div className={styles.railNav}>
            <div className={styles.railNavTitle}>On this page</div>
            <nav aria-label="Section jump links" className={styles.jumpNavList}>
              <a href="#summary" className={styles.jumpLink} data-cursor="link">
                <span className={styles.jumpDot} aria-hidden="true" />
                <span>Summary</span>
              </a>
              <a href="#education" className={styles.jumpLink} data-cursor="link">
                <span className={styles.jumpDot} aria-hidden="true" />
                <span>Education</span>
              </a>
              <a href="#projects" className={styles.jumpLink} data-cursor="link">
                <span className={styles.jumpDot} aria-hidden="true" />
                <span>Projects</span>
              </a>
              <a href="#skills" className={styles.jumpLink} data-cursor="link">
                <span className={styles.jumpDot} aria-hidden="true" />
                <span>Skills</span>
              </a>
              <a href="#honors" className={styles.jumpLink} data-cursor="link">
                <span className={styles.jumpDot} aria-hidden="true" />
                <span>Honors</span>
              </a>
            </nav>
          </div>
        </aside>

        {/* Physical Bone Résumé Paper Sheet */}
        <article className={`${styles.resumeSheet} resume-sheet`} id="resume-sheet" aria-label="Curriculum Vitae Sheet">
          {/* Header */}
          <header className={styles.resumeHeader}>
            <h2 className={styles.candidateName}>{profileData.name}</h2>
            <p className={styles.candidateTitle}>{profileData.role} &bull; {profileData.institution}</p>

            <div className={styles.contactLine}>
              <span>{profileData.location}</span>
              <span className={styles.contactSeparator} aria-hidden="true">&bull;</span>
              <a href={`mailto:${profileData.contact.email}`} className={styles.contactLink} data-cursor="link">
                {profileData.contact.email}
              </a>
              <span className={styles.contactSeparator} aria-hidden="true">&bull;</span>
              <a href={profileData.contact.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.contactLink} data-cursor="link">
                {profileData.contact.github}
              </a>
            </div>
          </header>

          {/* Summary */}
          <section className={styles.resumeSection} id="summary" tabIndex={-1}>
            <h3 className={styles.sectionTitle}>Summary</h3>
            <p className={styles.summaryText}>
              Computer Science and Engineering undergraduate student at East West University with a strong background
              in web application development, browser extensions, and software tools. Two-time National Board General Merit
              Scholarship recipient with a passion for building clean, reliable, and user-friendly software products.
            </p>
          </section>

          {/* Education */}
          <section className={styles.resumeSection} id="education" tabIndex={-1}>
            <h3 className={styles.sectionTitle}>Education</h3>
            <div className={styles.entryList}>
              <div className={`${styles.entryItem} row`}>
                <div className={styles.entryHead}>
                  <span className={styles.entryRole}>B.Sc. in Computer Science &amp; Engineering</span>
                  <span className={styles.entryDate}>2025 &mdash; Present</span>
                </div>
                <span className={styles.entryOrg}>East West University (EWU) &mdash; Dhaka, Bangladesh</span>
                <ul className={styles.bulletList}>
                  <li>Undergraduate studies focusing on Data Structures, Algorithms, Operating Systems, and Web Engineering.</li>
                </ul>
              </div>

              <div className={`${styles.entryItem} row`}>
                <div className={styles.entryHead}>
                  <span className={styles.entryRole}>Higher Secondary Certificate (HSC)</span>
                  <span className={styles.entryDate}>2023</span>
                </div>
                <span className={styles.entryOrg}>Intermediate (Science Division) &mdash; National Curriculum</span>
                <ul className={styles.bulletList}>
                  <li>Advanced coursework in Mathematics, Physics, Chemistry, and ICT.</li>
                </ul>
              </div>

              <div className={`${styles.entryItem} row`}>
                <div className={styles.entryHead}>
                  <span className={styles.entryRole}>Secondary School Certificate (SSC / Class 10) &mdash; GPA 5.0</span>
                  <span className={styles.entryDate}>2021</span>
                </div>
                <span className={styles.entryOrg}>National Board of Education, Bangladesh</span>
                <ul className={styles.bulletList}>
                  <li>Awarded National Board General Merit Scholarship for academic excellence.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Key Projects */}
          <section className={styles.resumeSection} id="projects" tabIndex={-1}>
            <h3 className={styles.sectionTitle}>Featured projects</h3>
            <div className={styles.entryList}>
              <div className={`${styles.entryItem} row`}>
                <div className={styles.entryHead}>
                  <span className={styles.entryRole}>PureFeed &mdash; Distraction-Free YouTube Extension</span>
                  <span className={styles.entryDate}>TypeScript &bull; Chromium MV3</span>
                </div>
                <ul className={styles.bulletList}>
                  <li>Engineered a browser extension that eliminates ads and sponsored clutter on YouTube in &lt;16ms.</li>
                  <li>Implemented efficient DOM mutation observers to avoid lag or browser memory bloat.</li>
                </ul>
              </div>

              <div className={`${styles.entryItem} row`}>
                <div className={styles.entryHead}>
                  <span className={styles.entryRole}>DocLensBD &mdash; Eyewear E-Commerce with 3D Try-On</span>
                  <span className={styles.entryDate}>React &bull; MediaPipe 3D &bull; Node.js</span>
                </div>
                <ul className={styles.bulletList}>
                  <li>Built a responsive online eyewear shop featuring real-time 3D webcam-based virtual frame try-on at 60 FPS.</li>
                  <li>Deployed and live on Render (<a href="https://doclensbd.onrender.com/" target="_blank" rel="noopener noreferrer" className={styles.inlineTouchLink} data-cursor="link">doclensbd.onrender.com</a>).</li>
                </ul>
              </div>

              <div className={`${styles.entryItem} row`}>
                <div className={styles.entryHead}>
                  <span className={styles.entryRole}>FocusGuard &mdash; System-Level Website Blocker</span>
                  <span className={styles.entryDate}>C++ &bull; Windows Registry &bull; Node.js</span>
                </div>
                <ul className={styles.bulletList}>
                  <li>Created a desktop application that enforces deep work sessions by blocking distracting domains at the OS level.</li>
                </ul>
              </div>

              <div className={`${styles.entryItem} row`}>
                <div className={styles.entryHead}>
                  <span className={styles.entryRole}>Rannabanna &mdash; Bengali Recipe Matchmaker</span>
                  <span className={styles.entryDate}>React &bull; Express &bull; SQLite</span>
                </div>
                <ul className={styles.bulletList}>
                  <li>Developed an ingredient matchmaking recipe app with serving calculators and fast SQLite queries.</li>
                  <li>Deployed and live on Render (<a href="https://rannabanna.onrender.com/" target="_blank" rel="noopener noreferrer" className={styles.inlineTouchLink} data-cursor="link">rannabanna.onrender.com</a>).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Technical Skills */}
          <section className={styles.resumeSection} id="skills" tabIndex={-1}>
            <h3 className={styles.sectionTitle}>Technical skills</h3>
            <div className={styles.skillsTable}>
              <div className={`${styles.skillRow} row`}>
                <span className={styles.skillCategoryName}>Languages:</span>
                <span className={styles.skillListText}>JavaScript, TypeScript, Python, C, C++, HTML5, CSS3, SQL</span>
              </div>
              <div className={`${styles.skillRow} row`}>
                <span className={styles.skillCategoryName}>Frontend:</span>
                <span className={styles.skillListText}>React, Next.js, CSS Modules, Tailwind CSS, Responsive Design, State Management</span>
              </div>
              <div className={`${styles.skillRow} row`}>
                <span className={styles.skillCategoryName}>Backend &amp; DB:</span>
                <span className={styles.skillListText}>Node.js, Express, PostgreSQL, SQLite, RESTful APIs</span>
              </div>
              <div className={`${styles.skillRow} row`}>
                <span className={styles.skillCategoryName}>Tools:</span>
                <span className={styles.skillListText}>Git, GitHub, Linux, Bash, Vite, Web Audio API, Chromium Extensions</span>
              </div>
            </div>
          </section>

          {/* Distinctions */}
          <section className={styles.resumeSection} id="honors" tabIndex={-1}>
            <h3 className={styles.sectionTitle}>Honors &amp; awards</h3>
            <ul className={styles.bulletList}>
              <li><strong>National Board General Merit Scholarship</strong> &mdash; SSC Class 10 (2021)</li>
              <li><strong>National Board General Merit Scholarship</strong> &mdash; JSC Class 8 (2018)</li>
              <li><strong>National Board Distinction (GPA 5.0)</strong> &mdash; PSC Class 5 (2015)</li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}

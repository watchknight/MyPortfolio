import { SpotlightCard } from '../../components/SpotlightCard/SpotlightCard';
import { ScrambleText } from '../../components/ScrambleText/ScrambleText';
import { sound } from '../../utils/audio';
import styles from './ResumePage.module.css';

export function ResumePage() {
  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Action Bar */}
      <div className={styles.topBar}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>Verified Credentials</span>
          <h1 className={styles.pageTitle} data-cursor="inspect" data-cursor-label="CV">
            <ScrambleText text="Curriculum Vitae" />
          </h1>
        </div>

        <div className={styles.actionGroup}>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primaryAction}
            onClick={() => sound.playTick()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download PDF</span>
          </a>

          <button
            type="button"
            className={styles.secondaryAction}
            onClick={handlePrint}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Résumé</span>
          </button>
        </div>
      </div>

      {/* Digital Résumé Paper Sheet */}
      <SpotlightCard
        as="article"
        className={styles.resumeSheet}
        contentClassName={styles.resumeSheetContent}
        tiltIntensity={2}
      >
        {/* Header */}
        <header className={styles.resumeHeader}>
          <div className={styles.credentialPill}>
            <span className={styles.credentialDot} />
            <span>VERIFIED CREDENTIAL // EWU CSE UNDERGRADUATE</span>
          </div>
          <h2 className={styles.candidateName}>Abdur Rahman Moayed</h2>
          <p className={styles.candidateTitle}>Software Engineer &bull; Computer Science Undergraduate</p>

          <div className={styles.contactLine}>
            <span>Dhaka, Bangladesh</span>
            <span className={styles.contactSeparator}>&bull;</span>
            <a href="mailto:armabdur.rahman04@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
              armabdur.rahman04@gmail.com
            </a>
            <span className={styles.contactSeparator}>&bull;</span>
            <a href="https://github.com/watchknight" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              github.com/watchknight
            </a>
          </div>
        </header>

        {/* Summary */}
        <section className={styles.resumeSection}>
          <h3 className={styles.sectionTitle}>Summary</h3>
          <p className={styles.summaryText}>
            Computer Science and Engineering undergraduate student at East West University with a strong background
            in web application development, browser extensions, and software tools. Two-time National Board General Merit
            Scholarship recipient with a passion for building clean, reliable, and user-friendly software products.
          </p>
        </section>

        {/* Education */}
        <section className={styles.resumeSection}>
          <h3 className={styles.sectionTitle}>Education</h3>
          <div className={styles.entryList}>
            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>B.Sc. in Computer Science &amp; Engineering</span>
                <span className={styles.entryDate}>2025 &mdash; Present</span>
              </div>
              <span className={styles.entryOrg}>East West University (EWU) &mdash; Dhaka, Bangladesh</span>
              <ul className={styles.bulletList}>
                <li>Undergraduate studies focusing on Data Structures, Algorithms, Operating Systems, and Web Engineering.</li>
              </ul>
            </div>

            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>Higher Secondary Certificate (HSC)</span>
                <span className={styles.entryDate}>2023</span>
              </div>
              <span className={styles.entryOrg}>Intermediate (Science Division) &mdash; National Curriculum</span>
              <ul className={styles.bulletList}>
                <li>Advanced coursework in Mathematics, Physics, Chemistry, and ICT.</li>
              </ul>
            </div>

            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>Secondary School Certificate (SSC / Class 10) &mdash; GPA 5.0</span>
                <span className={styles.entryDate}>2021</span>
              </div>
              <span className={styles.entryOrg}>National Board of Education, Bangladesh</span>
              <ul className={styles.bulletList}>
                <li>Awarded National Board General Merit Scholarship for academic excellence.</li>
              </ul>
            </div>

            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>Junior School Certificate (JSC / Class 8) &mdash; GPA 5.0</span>
                <span className={styles.entryDate}>2018</span>
              </div>
              <span className={styles.entryOrg}>National Board of Education, Bangladesh</span>
              <ul className={styles.bulletList}>
                <li>Awarded National Board General Merit Scholarship.</li>
              </ul>
            </div>

            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>Primary School Certificate (PSC / Class 5) &mdash; GPA 5.0</span>
                <span className={styles.entryDate}>2015</span>
              </div>
              <span className={styles.entryOrg}>National Board of Education, Bangladesh</span>
              <ul className={styles.bulletList}>
                <li>Achieved perfect GPA 5.0 with verified National Board Distinction.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Key Projects */}
        <section className={styles.resumeSection}>
          <h3 className={styles.sectionTitle}>Featured Projects</h3>
          <div className={styles.entryList}>
            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>PureFeed &mdash; Distraction-Free YouTube Extension</span>
                <span className={styles.entryDate}>TypeScript &bull; Chromium MV3</span>
              </div>
              <ul className={styles.bulletList}>
                <li>Engineered a browser extension that eliminates ads and sponsored clutter on YouTube in &lt;16ms.</li>
                <li>Implemented efficient DOM mutation observers to avoid lag or browser memory bloat.</li>
              </ul>
            </div>

            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>DocLensBD &mdash; Eyewear E-Commerce with 3D Try-On</span>
                <span className={styles.entryDate}>React &bull; MediaPipe 3D &bull; Node.js</span>
              </div>
              <ul className={styles.bulletList}>
                <li>Built a responsive online eyewear shop featuring real-time 3D webcam-based virtual frame try-on at 60 FPS.</li>
                <li>Deployed and live on Render (<a href="https://doclensbd.onrender.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>doclensbd.onrender.com</a>).</li>
              </ul>
            </div>

            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>FocusGuard &mdash; System-Level Website Blocker</span>
                <span className={styles.entryDate}>C++ &bull; Windows Registry &bull; Node.js</span>
              </div>
              <ul className={styles.bulletList}>
                <li>Created a desktop application that enforces deep work sessions by blocking distracting domains at the OS level.</li>
              </ul>
            </div>

            <div className={styles.entryItem}>
              <div className={styles.entryHead}>
                <span className={styles.entryRole}>Rannabanna &mdash; Bengali Recipe Matchmaker</span>
                <span className={styles.entryDate}>React &bull; Express &bull; SQLite</span>
              </div>
              <ul className={styles.bulletList}>
                <li>Developed an ingredient matchmaking recipe app with serving calculators and fast SQLite queries.</li>
                <li>Deployed and live on Render (<a href="https://rannabanna.onrender.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>rannabanna.onrender.com</a>).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technical Skills */}
        <section className={styles.resumeSection}>
          <h3 className={styles.sectionTitle}>Technical Skills</h3>
          <div className={styles.skillsTable}>
            <div className={styles.skillRow}>
              <span className={styles.skillCategoryName}>Languages:</span>
              <span className={styles.skillListText}>JavaScript, TypeScript, Python, C, C++, HTML5, CSS3, SQL</span>
            </div>
            <div className={styles.skillRow}>
              <span className={styles.skillCategoryName}>Frontend:</span>
              <span className={styles.skillListText}>React, Next.js, CSS Modules, Tailwind CSS, Responsive Design, State Management</span>
            </div>
            <div className={styles.skillRow}>
              <span className={styles.skillCategoryName}>Backend &amp; DB:</span>
              <span className={styles.skillListText}>Node.js, Express, PostgreSQL, SQLite, RESTful APIs</span>
            </div>
            <div className={styles.skillRow}>
              <span className={styles.skillCategoryName}>Tools:</span>
              <span className={styles.skillListText}>Git, GitHub, Linux, Bash, Vite, Web Audio API, Chromium Extensions</span>
            </div>
          </div>
        </section>

        {/* Distinctions */}
        <section className={styles.resumeSection}>
          <h3 className={styles.sectionTitle}>Honors &amp; Awards</h3>
          <ul className={styles.bulletList}>
            <li><strong>National Board General Merit Scholarship</strong> &mdash; SSC Class 10 (2021)</li>
            <li><strong>National Board General Merit Scholarship</strong> &mdash; JSC Class 8 (2018)</li>
            <li><strong>National Board Distinction (GPA 5.0)</strong> &mdash; PSC Class 5 (2015)</li>
          </ul>
        </section>
      </SpotlightCard>
    </div>
  );
}

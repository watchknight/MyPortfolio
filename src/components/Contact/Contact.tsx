import { useState } from 'react';
import { ScrambleText } from '../ScrambleText/ScrambleText';
import { sound } from '../../utils/audio';
import styles from './Contact.module.css';

export function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText('armabdur.rahman04@gmail.com');
    setCopied(true);
    sound.playChirp(700, 1100, 0.05, 0.06);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <section className={styles.section} id="contact">
      <div className="container">
        <div className={styles.terminalCard}>
          <div className={styles.terminalHead}>
            <div className={styles.terminalIdentity}>
              <span className={styles.terminalDot} />
              <span>TERMINAL://COMMUNICATION_DISPATCH</span>
            </div>
            <div className={styles.terminalMeta}>
              <span className={styles.terminalPill}>RESPONSE_WINDOW &lt; 24H</span>
              <span>UTC+6 (DHAKA)</span>
            </div>
          </div>

          <div className={styles.terminalBody}>
            <div className={styles.dispatchCol}>
              <div className={styles.titleGroup}>
                <h2 className={styles.title}>
                  <ScrambleText text="Initiate Direct Contact" />
                </h2>
                <p className={styles.intro}>
                  I am actively seeking international remote software engineering internships. If you are
                  building resilient browser systems, security infrastructure, or high-throughput web architecture,
                  I am ready to build.
                </p>
              </div>

              <div className={styles.actionRow}>
                <a
                  href="mailto:armabdur.rahman04@gmail.com"
                  className={styles.sendBtn}
                  onClick={() => sound.playClick(850, 0.03, 0.08)}
                  data-cursor="link"
                >
                  <span>Dispatch Message via Email</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </a>

                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={copyEmail}
                  aria-label="Copy email address"
                  data-cursor="link"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{copied ? 'Copied to Clipboard ✓' : 'Copy Email Address'}</span>
                </button>
              </div>
            </div>

            <div className={styles.channelsCol}>
              <div className={styles.channelGrid}>
                <div className={styles.channelItem}>
                  <span className={styles.channelLabel}>Primary Email</span>
                  <a href="mailto:armabdur.rahman04@gmail.com" className={styles.channelLink} data-cursor="link">
                    <span>armabdur.rahman04@gmail.com</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>

                <div className={styles.channelItem}>
                  <span className={styles.channelLabel}>GitHub Workspace</span>
                  <a href="https://github.com/watchknight" target="_blank" rel="noopener noreferrer" className={styles.channelLink} data-cursor="link">
                    <span>github.com/watchknight</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>

                <div className={styles.channelItem}>
                  <span className={styles.channelLabel}>LinkedIn Registry</span>
                  <a href="https://linkedin.com/in/abdur-rahman-moayed-9225b5389" target="_blank" rel="noopener noreferrer" className={styles.channelLink} data-cursor="link">
                    <span>in/abdur-rahman-moayed</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>

                <div className={styles.channelItem}>
                  <span className={styles.channelLabel}>Curriculum Vitae</span>
                  <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className={styles.channelLink} data-cursor="link">
                    <span>resume.pdf (Download)</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <span className={styles.signature}>
            Designed &amp; Engineered by Abdur Rahman Moayed
          </span>
          <span>East West University CSE &bull; Dhaka, Bangladesh &bull; Available Worldwide</span>
        </footer>
      </div>
    </section>
  );
}

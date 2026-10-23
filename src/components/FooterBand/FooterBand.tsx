import { useState, useEffect, useCallback, useRef } from 'react';
import { RollText } from '../RollText/RollText';
import { Magnetic } from '../Magnetic/Magnetic';
import { profileData } from '../../data/profile';
import { sound } from '../../utils/audio';
import { copyToClipboard } from '../../utils/clipboard';
import styles from './FooterBand.module.css';

export interface FooterBandProps {
  showCta?: boolean;
  onNavigate: (path: string) => void;
}

export function FooterBand({ showCta = true, onNavigate }: FooterBandProps) {
  const [dhakaTime, setDhakaTime] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live Dhaka Clock (updates each minute, UTC+6)
  useEffect(() => {
    const updateTime = () => {
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date());
      setDhakaTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = useCallback(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
  }, []);

  const handleCopyEmail = useCallback(async () => {
    await copyToClipboard(profileData.contact.email);
    setCopiedEmail(true);
    sound.play('chime');
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedEmail(false);
      copyTimeoutRef.current = null;
    }, 1600); // 1.6s per spec
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section
      {...(showCta ? { id: 'contact', 'data-section': 'contact' } : {})}
      className={showCta ? styles.footerSection : styles.footerSectionOnly}
      aria-label={showCta ? 'Contact and Footer' : 'Site Footer'}
      data-print="hide"
    >
      {showCta && (
        <div className={styles.contactCard} data-tile="surface">
          <h2 className={styles.contactHeading}>Interested in working together?</h2>
          <p className={styles.contactSubtext}>
            I&apos;m currently open for software engineering internships and freelance web projects.
            Feel free to reach out anytime.
          </p>

          <div className={styles.contactActions}>
            <Magnetic strength={0.3}>
              <button
                type="button"
                className={styles.primaryPillBtn}
                onClick={() => onNavigate('/contact')}
                data-cursor="link"
                data-magnetic="0.3"
              >
                <RollText>Send me a message</RollText>
              </button>
            </Magnetic>

            <Magnetic strength={0.3}>
              <button
                type="button"
                className={`${styles.secondaryPillBtn} ${copiedEmail ? 'btn-copied' : ''}`}
                onClick={handleCopyEmail}
                aria-live="polite"
                data-cursor="link"
                data-magnetic="0.3"
              >
                <RollText>{copiedEmail ? 'Copied' : 'Copy email'}</RollText>
              </button>
            </Magnetic>
          </div>

          <div className={styles.socialLinksRow}>
            <Magnetic strength={0.3}>
              <a
                href="https://github.com/watchknight"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                data-cursor="link"
                data-magnetic="0.3"
              >
                GitHub
              </a>
            </Magnetic>
            <Magnetic strength={0.3}>
              <a
                href="https://linkedin.com/in/abdur-rahman-moayed-9225b5389"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                data-cursor="link"
                data-magnetic="0.3"
              >
                LinkedIn
              </a>
            </Magnetic>
            <Magnetic strength={0.3}>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                data-cursor="link"
                data-magnetic="0.3"
              >
                Résumé (PDF)
              </a>
            </Magnetic>
          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerCopyright}>
            &copy; {new Date().getFullYear()} Abdur Rahman Moayed
          </span>
          <span className={styles.footerLocation}>
            Dhaka, Bangladesh ({dhakaTime || '14:32'} UTC+6)
          </span>
          <Magnetic strength={0.3}>
            <button
              type="button"
              className={styles.backToTopBtn}
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              data-cursor="link"
              data-magnetic="0.3"
            >
              Back to top &uarr;
            </button>
          </Magnetic>
        </div>
      </footer>
    </section>
  );
}

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../../utils/audio';
import styles from './InsightNode.module.css';

interface InsightNodeProps {
  keyword: string;
  tag: string;
  title: string;
  description: string;
  metric: string;
  href: string;
  icon?: 'radar' | 'network' | 'academic' | 'systems';
}

export function InsightNode({
  keyword,
  tag,
  title,
  description,
  metric,
  href,
  icon = 'radar',
}: InsightNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    sound.playTick();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    sound.playClick(820, 0.02, 0.06);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sound.playClick(820, 0.02, 0.06);
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <span
      className={styles.nodeTrigger}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-expanded={isOpen}
      aria-label={`${keyword} (explore ${title})`}
      data-cursor="inspect"
      data-cursor-label="INSIGHT"
    >
      <span className={styles.nodeIcon} aria-hidden="true">
        {icon === 'radar' && (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        )}
        {icon === 'network' && (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        )}
        {icon === 'academic' && (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        )}
        {icon === 'systems' && (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        )}
      </span>

      <span>{keyword}</span>
      <span className={styles.nodeUnderline} aria-hidden="true" />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.popover}
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="tooltip"
          >
            <div className={styles.popoverTag}>
              <span className={styles.popoverDot} />
              <span>{tag}</span>
            </div>
            <div className={styles.popoverTitle}>{title}</div>
            <div className={styles.popoverDesc}>{description}</div>
            <div className={styles.popoverFooter}>
              <span className={styles.popoverMetric}>{metric}</span>
              <span className={styles.popoverAction}>Click to jump &rarr;</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

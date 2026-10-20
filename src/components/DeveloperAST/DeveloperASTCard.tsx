import { useState, useRef, useEffect } from 'react';
import { sound } from '../../utils/audio';
import styles from './DeveloperASTCard.module.css';

interface DeveloperASTCardProps {
  className?: string;
}

export function DeveloperASTCard({ className = '' }: DeveloperASTCardProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawSchema = `/**
 * @title Systems Architect & Countermeasure Engineer Schema
 * @node Dhaka Node (23.8103° N, 90.4125° E)
 * @rigor East West University (EWU) // Board Merit Scholar
 */
export interface SystemsArchitect {
  readonly engineer: "Abdur Rahman Moayed";
  readonly location: "Dhaka, Bangladesh [23.8103° N, 90.4125° E]";
  readonly academicBase: {
    institution: "East West University (EWU)";
    degree: "B.Sc. in Computer Science & Engineering (2025—Present)";
    distinctions: [
      "Board General Merit Scholarship (JSC Class 8)",
      "Board General Merit Scholarship (SSC Class 10)",
      "Board Distinction Perfect GPA 5.0 (PSC Class 5)"
    ];
  };
  readonly productionSystems: {
    purefeed: "Chromium MV3 Main-World Anti-Adblock Defeat Engine (<16ms)";
    focusguard: "OS-Level DNS Sinkhole & Windows Registry Machine Policy (580+ Hosts)";
    rannabanna: "Bengali Recipe Matchmaker & Heuristic Scaling Engine (0.8ms SQLite)";
    doclensbd: "MediaPipe 468-Point 3D Face Mesh Client Virtual Try-On (60 FPS)";
    poshra: "Next.js App Router Fashion Commerce & SSLCommerz Regional Gateway";
    sentinelPortfolio: "Zero-Deadspace HUD, Canvas Reticle Grid & Web Audio DSP Synthesizer";
  };
  readonly technicalPhilosophy: "Zero deadweight, hardware-native execution, verified engineering";
}`;

  const handleCopy = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rawSchema).catch(() => {});
      }
    } catch {
      // ignore clipboard error in restricted/headless environments
    }
    setCopied(true);
    sound.play('chime');

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copyTimeoutRef.current = null;
    }, 1600); // 1.6s per spec
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <article
      className={`${styles.manifestCard} ${className}`.trim()}
      data-tile="surface"
      data-cursor="inspect"
      data-degree="5"
      aria-label="Systems Architect Type Schema"
    >
      <header className={styles.terminalHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.macControls} aria-hidden="true">
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
          </div>
          <span className={styles.windowTitle}>architect.schema.ts</span>
          <span className={styles.windowBadge}>TypeScript AST</span>
        </div>
        <button
          type="button"
          className={styles.copyButton}
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy .ts'}
          data-cursor="link"
          data-magnetic="0.3"
        >
          {copied ? 'Copied' : 'Copy .ts'}
        </button>
      </header>

      <pre className={`code ${styles.codeArea}`} tabIndex={0} role="region" aria-label="TypeScript Schema Code">
        <code>
          <span className="c">/**</span>{'\n'}
          <span className="c"> * @title Systems Architect &amp; Countermeasure Engineer Schema</span>{'\n'}
          <span className="c"> * @node Dhaka Node (23.8103° N, 90.4125° E)</span>{'\n'}
          <span className="c"> * @rigor East West University (EWU) // Board Merit Scholar</span>{'\n'}
          <span className="c"> */</span>{'\n'}
          <span className="k">export interface </span><span className="t">SystemsArchitect</span> {'{'}{'\n'}
          {'  '}<span className="k">readonly </span>engineer: <span className="s">"Abdur Rahman Moayed"</span>;{'\n'}
          {'  '}<span className="k">readonly </span>location: <span className="s">"Dhaka, Bangladesh [23.8103° N, 90.4125° E]"</span>;{'\n'}
          {'  '}<span className="k">readonly </span>academicBase: {'{'}{'\n'}
          {'    '}institution: <span className="s">"East West University (EWU)"</span>;{'\n'}
          {'    '}degree: <span className="s">"B.Sc. in Computer Science &amp; Engineering (2025—Present)"</span>;{'\n'}
          {'    '}distinctions: [{'\n'}
          {'      '}<span className="s">"Board General Merit Scholarship (JSC Class 8)"</span>,{'\n'}
          {'      '}<span className="s">"Board General Merit Scholarship (SSC Class 10)"</span>,{'\n'}
          {'      '}<span className="s">"Board Distinction Perfect GPA 5.0 (PSC Class 5)"</span>{'\n'}
          {'    '}];{'\n'}
          {'  '}{'}'};{'\n'}
          {'  '}<span className="k">readonly </span>productionSystems: {'{'}{'\n'}
          {'    '}purefeed: <span className="s">"Chromium MV3 Main-World Anti-Adblock Defeat Engine (&lt;16ms)"</span>;{'\n'}
          {'    '}focusguard: <span className="s">"OS-Level DNS Sinkhole &amp; Windows Registry Machine Policy (580+ Hosts)"</span>;{'\n'}
          {'    '}rannabanna: <span className="s">"Bengali Recipe Matchmaker &amp; Heuristic Scaling Engine (0.8ms SQLite)"</span>;{'\n'}
          {'    '}doclensbd: <span className="s">"MediaPipe 468-Point 3D Face Mesh Client Virtual Try-On (60 FPS)"</span>;{'\n'}
          {'    '}poshra: <span className="s">"Next.js App Router Fashion Commerce &amp; SSLCommerz Regional Gateway"</span>;{'\n'}
          {'    '}sentinelPortfolio: <span className="s">"Zero-Deadspace HUD, Canvas Reticle Grid &amp; Web Audio DSP Synthesizer"</span>;{'\n'}
          {'  '}{'}'};{'\n'}
          {'  '}<span className="k">readonly </span>technicalPhilosophy: <span className="s">"Zero deadweight, hardware-native execution, verified engineering"</span>;{'\n'}
          {'}'}
        </code>
      </pre>

      <footer className={styles.terminalFooter}>
        <div className={styles.footerNode}>
          <span className={styles.pulseDot} aria-hidden="true" />
          <span>ORIGIN NODE // ASIA-SOUTH-1 (DHAKA)</span>
        </div>
        <div>SHA-256 // VERIFIED SCHEMA</div>
      </footer>
    </article>
  );
}

import { useState } from 'react';
import { sound } from '../../utils/audio';
import styles from './DeveloperASTCard.module.css';

export function DeveloperASTCard() {
  const [copied, setCopied] = useState(false);

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
    navigator.clipboard.writeText(rawSchema);
    setCopied(true);
    sound.playClick(900, 0.03, 0.08);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className={styles.cardContainer} aria-label="Systems Architect Type Schema">
      <header className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.fileIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </span>
          <span className={styles.fileName}>architect.schema.ts</span>
          <span className={styles.fileBadge}>TypeScript AST</span>
        </div>
        <button
          type="button"
          className={styles.copyButton}
          onClick={handleCopy}
          aria-label="Copy TypeScript Schema to Clipboard"
        >
          {copied ? '✓ COPIED' : 'COPY .TS'}
        </button>
      </header>

      <pre className={styles.codeArea}>
        <code>
          <span className={styles.comment}>/**</span><br />
          <span className={styles.comment}> * @title Systems Architect &amp; Countermeasure Engineer Schema</span><br />
          <span className={styles.comment}> * @node Dhaka Node (23.8103° N, 90.4125° E)</span><br />
          <span className={styles.comment}> * @rigor East West University (EWU) // Board Merit Scholar</span><br />
          <span className={styles.comment}> */</span><br />
          <span className={styles.keyword}>export interface </span>
          <span className={styles.typeName}>SystemsArchitect </span>
          <span className={styles.punct}>{'{'}</span><br />
          {'  '}<span className={styles.keyword}>readonly </span>
          <span className={styles.propKey}>engineer</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"Abdur Rahman Moayed"</span><span className={styles.punct}>;</span><br />
          {'  '}<span className={styles.keyword}>readonly </span>
          <span className={styles.propKey}>location</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"Dhaka, Bangladesh [23.8103° N, 90.4125° E]"</span><span className={styles.punct}>;</span><br />
          {'  '}<span className={styles.keyword}>readonly </span>
          <span className={styles.propKey}>academicBase</span><span className={styles.punct}>: {'{'}</span><br />
          {'    '}<span className={styles.propKey}>institution</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"East West University (EWU)"</span><span className={styles.punct}>;</span><br />
          {'    '}<span className={styles.propKey}>degree</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"B.Sc. in Computer Science &amp; Engineering (2025—Present)"</span><span className={styles.punct}>;</span><br />
          {'    '}<span className={styles.propKey}>distinctions</span><span className={styles.punct}>: [</span><br />
          {'      '}<span className={styles.stringVal}>"Board General Merit Scholarship (JSC Class 8)"</span><span className={styles.punct}>,</span><br />
          {'      '}<span className={styles.stringVal}>"Board General Merit Scholarship (SSC Class 10)"</span><span className={styles.punct}>,</span><br />
          {'      '}<span className={styles.stringVal}>"Board Distinction Perfect GPA 5.0 (PSC Class 5)"</span><br />
          {'    '}<span className={styles.punct}>];</span><br />
          {'  '}<span className={styles.punct}>{'}'};</span><br />
          {'  '}<span className={styles.keyword}>readonly </span>
          <span className={styles.propKey}>productionSystems</span><span className={styles.punct}>: {'{'}</span><br />
          {'    '}<span className={styles.propKey}>purefeed</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"Chromium MV3 Main-World Anti-Adblock Defeat Engine (&lt;16ms)"</span><span className={styles.punct}>;</span><br />
          {'    '}<span className={styles.propKey}>focusguard</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"OS-Level DNS Sinkhole &amp; Windows Registry Machine Policy (580+ Hosts)"</span><span className={styles.punct}>;</span><br />
          {'    '}<span className={styles.propKey}>rannabanna</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"Bengali Recipe Matchmaker &amp; Heuristic Scaling Engine (0.8ms SQLite)"</span><span className={styles.punct}>;</span><br />
          {'    '}<span className={styles.propKey}>doclensbd</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"MediaPipe 468-Point 3D Face Mesh Client Virtual Try-On (60 FPS)"</span><span className={styles.punct}>;</span><br />
          {'    '}<span className={styles.propKey}>poshra</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"Next.js App Router Fashion Commerce &amp; SSLCommerz Regional Gateway"</span><span className={styles.punct}>;</span><br />
          {'    '}<span className={styles.propKey}>sentinelPortfolio</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"Zero-Deadspace HUD, Canvas Reticle Grid &amp; Web Audio DSP Synthesizer"</span><span className={styles.punct}>;</span><br />
          {'  '}<span className={styles.punct}>{'}'};</span><br />
          {'  '}<span className={styles.keyword}>readonly </span>
          <span className={styles.propKey}>technicalPhilosophy</span><span className={styles.punct}>: </span>
          <span className={styles.stringVal}>"Zero deadweight, hardware-native execution, verified engineering"</span><span className={styles.punct}>;</span><br />
          <span className={styles.punct}>{'}'}</span>
        </code>
      </pre>

      <footer className={styles.cardFooter}>
        <div className={styles.footerNode}>
          <span className={styles.pulseDot} />
          <span>ORIGIN NODE // ASIA-SOUTH-1 (DHAKA)</span>
        </div>
        <div>SHA-256 // VERIFIED SCHEMA</div>
      </footer>
    </div>
  );
}

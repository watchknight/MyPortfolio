import { sound } from '../../utils/audio';
import styles from './TelemetryRibbon.module.css';

interface TelemetryEntry {
  tag: string;
  value: string;
  isEmerald?: boolean;
}

const TELEMETRY_DATA: TelemetryEntry[] = [
  { tag: 'SYS://STATUS', value: '100% OPERATIONAL', isEmerald: true },
  { tag: 'ENGINE_CORE', value: 'CHROMIUM MV3 // MAIN-WORLD HOOK' },
  { tag: 'ORIGIN_NODE', value: 'DHAKA, BANGLADESH (UTC+6)', isEmerald: true },
  { tag: 'SECURITY_SHIELD', value: 'SYSTEM HOSTS & WIN-REGISTRY PIN' },
  { tag: 'VISION_PIPELINE', value: '60 FPS WEBASSEMBLY FACEMESH' },
  { tag: 'ACADEMIC_FOUNDATION', value: 'EAST WEST UNIVERSITY // CSE' },
  { tag: 'RESPONSE_LATENCY', value: '<16MS DISPATCH LOOP', isEmerald: true },
  { tag: 'ALGORITHMS', value: 'NON-LINEAR THERMODYNAMICS & 0.8MS SQL' },
  { tag: 'PAYMENT_RAIL', value: 'RESILIENT MULTI-GATEWAY RETRY' },
  { tag: 'MERIT_RECORD', value: 'TALENT-POOL SCHOLAR (PSC/JSC/SSC)' },
];

export function TelemetryRibbon() {
  const handleItemHover = () => {
    sound.playTick();
  };

  const renderGroup = (keyPrefix: string) => (
    <div className={styles.itemGroup} key={keyPrefix}>
      {TELEMETRY_DATA.map((item, index) => (
        <div
          key={`${keyPrefix}-${index}`}
          className={styles.item}
          onMouseEnter={handleItemHover}
        >
          <span className={`${styles.dot} ${item.isEmerald ? styles.dotEmerald : ''}`} />
          <span className={`${styles.badge} ${item.isEmerald ? styles.badgeEmerald : ''}`}>
            {item.tag}
          </span>
          <span>{item.value}</span>
          <span className={styles.separator}>//</span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={styles.ribbonContainer}
      role="region"
      aria-label="Live System Telemetry Ribbon"
    >
      <div className={styles.track}>
        {renderGroup('group-1')}
        {renderGroup('group-2')}
      </div>
    </div>
  );
}

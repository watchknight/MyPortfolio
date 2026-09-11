import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './MechanicalCounter.module.css';

interface MechanicalCounterProps {
  value: number;
  className?: string;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function MechanicalCounter({ value, className = '' }: MechanicalCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const stringValue = value.toString();

  if (prefersReducedMotion) {
    return <span className={`${styles.counterWrapper} ${className}`}>{stringValue}</span>;
  }

  return (
    <span className={`${styles.counterWrapper} ${className}`} aria-label={`${value}`}>
      {stringValue.split('').map((char, index) => {
        const isDigit = /\d/.test(char);

        if (!isDigit) {
          return (
            <span key={`sym-${index}`} className={styles.symbolSlot}>
              {char}
            </span>
          );
        }

        const digitValue = parseInt(char, 10);

        return (
          <span key={`digit-${index}`} className={styles.digitSlot} aria-hidden="true">
            <span
              className={styles.digitColumn}
              style={{ transform: `translateY(-${digitValue * 10}%)` }}
            >
              {DIGITS.map((num) => (
                <span key={num} className={styles.digitNumber}>
                  {num}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

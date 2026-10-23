import React, { useRef, useEffect } from 'react';
import { useDecryptScramble } from '../../hooks/useDecryptScramble';

interface RollTextProps {
  children: React.ReactNode;
  className?: string;
  decrypt?: boolean;
}

/**
 * RollText
 *
 * Micro-Interaction 1: Button label roll (desktop hover only).
 * On hover, the primary label slides up (-50% / -100% of line height)
 * while a duplicate slides in from below in 0.35s power3.out.
 * Also supports optional cypher-decrypt scramble on hover.
 * Gated by @media (hover: hover) and (pointer: fine).
 * Disabled under prefers-reduced-motion.
 */
export function RollText({ children, className = '', decrypt = false }: RollTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  let text = '';
  if (typeof children === 'string' || typeof children === 'number') {
    text = String(children);
  } else if (Array.isArray(children)) {
    const isTextArray = children.every((c) => typeof c === 'string' || typeof c === 'number');
    if (isTextArray) {
      text = children.join('');
    }
  }

  const { displayText, trigger } = useDecryptScramble(text, {
    playSound: true,
  });

  useEffect(() => {
    if (!decrypt) return;
    const parentInteractive = spanRef.current?.closest('button, a');
    if (!parentInteractive) return;
    const onEnter = () => trigger();
    parentInteractive.addEventListener('mouseenter', onEnter);
    return () => parentInteractive.removeEventListener('mouseenter', onEnter);
  }, [decrypt, trigger]);

  if (!text) {
    return <span className={className}>{children}</span>;
  }

  const activeText = decrypt ? displayText : text;

  return (
    <span
      ref={spanRef}
      className={`btn-roll ${className}`.trim()}
      onMouseEnter={decrypt ? trigger : undefined}
    >
      <span className="btn-roll-track">
        <span className="btn-roll-label">{activeText}</span>
        <span className="btn-roll-label" aria-hidden="true">
          {activeText}
        </span>
      </span>
    </span>
  );
}

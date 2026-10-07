import React from 'react';

interface RollTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * RollText
 *
 * Micro-Interaction 1: Button label roll (desktop hover only).
 * On hover, the primary label slides up (-50% / -100% of line height)
 * while a duplicate slides in from below in 0.35s power3.out.
 * Gated by @media (hover: hover) and (pointer: fine).
 * Disabled under prefers-reduced-motion.
 */
export function RollText({ children, className = '' }: RollTextProps) {
  let text = '';
  if (typeof children === 'string' || typeof children === 'number') {
    text = String(children);
  } else if (Array.isArray(children)) {
    const isTextArray = children.every((c) => typeof c === 'string' || typeof c === 'number');
    if (isTextArray) {
      text = children.join('');
    }
  }

  if (!text) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`btn-roll ${className}`.trim()}>
      <span className="btn-roll-track">
        <span className="btn-roll-label">{text}</span>
        <span className="btn-roll-label" aria-hidden="true">
          {text}
        </span>
      </span>
    </span>
  );
}

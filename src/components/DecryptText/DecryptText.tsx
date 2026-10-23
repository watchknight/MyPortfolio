import React from 'react';
import { useDecryptScramble } from '../../hooks/useDecryptScramble';

interface DecryptTextProps {
  text: string;
  as?: React.ElementType;
  className?: string;
  hover?: boolean;
  sound?: boolean;
  duration?: number;
  chars?: string;
  children?: never;
  [key: string]: unknown;
}

export const DecryptText: React.FC<DecryptTextProps> = ({
  text,
  as: Component = 'span',
  className,
  hover = true,
  sound = true,
  duration = 320,
  chars,
  ...rest
}) => {
  const { displayText, trigger } = useDecryptScramble(text, {
    duration,
    playSound: sound,
    chars,
  });

  return (
    <Component
      className={className}
      onMouseEnter={hover ? trigger : undefined}
      {...rest}
    >
      {displayText}
    </Component>
  );
};

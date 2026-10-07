import React, { type ReactNode, isValidElement, cloneElement } from 'react';

interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({ children, strength = 0.3, className }: MagneticProps) {
  if (isValidElement(children) && !className) {
    const childProps = children.props as Record<string, unknown>;
    return cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      'data-magnetic': childProps['data-magnetic'] ?? strength,
    });
  }

  return (
    <div
      className={className}
      data-magnetic={strength}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}



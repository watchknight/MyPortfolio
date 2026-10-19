import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  intro?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, intro, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`page__header ${className}`.trim()}>
      <h1 className="page__title">{title}</h1>
      {intro && <p className="page__intro">{intro}</p>}
      {actions && <div className="page__actions">{actions}</div>}
    </header>
  );
}

import { useState, useEffect, useCallback } from 'react';

export type RoutePath = '/' | '/works' | '/foundation' | '/resume' | '/contact';

function normalizePath(path: string): RoutePath {
  const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (['/works', '/foundation', '/resume', '/contact'].includes(clean)) {
    return clean as RoutePath;
  }
  return '/';
}

export function useRouter(initialPath?: string) {
  const [currentPath, setCurrentPath] = useState<RoutePath>(() => {
    if (initialPath) return normalizePath(initialPath);
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/';
  });

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const normalized = normalizePath(to);
    if (window.location.pathname !== normalized) {
      window.history.pushState(null, '', normalized);
      setCurrentPath(normalized);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return { currentPath, navigate };
}

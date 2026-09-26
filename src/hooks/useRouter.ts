import { useState, useEffect, useCallback } from 'react';

export type RoutePath = '/' | '/works' | '/foundation' | '/resume' | '/contact' | '/404';

const KNOWN_ROUTES: RoutePath[] = ['/', '/works', '/foundation', '/resume', '/contact'];

function normalizePath(path: string): RoutePath {
  const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (KNOWN_ROUTES.includes(clean as RoutePath)) {
    return clean as RoutePath;
  }
  return '/404';
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
    const targetUrl = normalized === '/404' ? to : normalized;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
      setCurrentPath(normalized);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentPath(normalized);
    }
  }, []);

  return { currentPath, navigate };
}

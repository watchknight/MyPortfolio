import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useRouter } from './hooks/useRouter';
import { projects, type ProjectData } from './data/projects';
import { initCursor } from './motion/cursor';
import { initMotion, ScrollTrigger, gsap } from './motion/index';
import { Nav } from './components/Nav/Nav';
import { HomePage } from './pages/Home/HomePage';
import { useScrollLock } from './utils/scrollLock';

const LazyWorksPage = lazy(() => import('./pages/Works/WorksPage').then((m) => ({ default: m.WorksPage })));
const LazyFoundationPage = lazy(() => import('./pages/Foundation/FoundationPage').then((m) => ({ default: m.FoundationPage })));
const LazyResumePage = lazy(() => import('./pages/Resume/ResumePage').then((m) => ({ default: m.ResumePage })));
const LazyContactPage = lazy(() => import('./pages/Contact/ContactPage').then((m) => ({ default: m.ContactPage })));
const LazyNotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const LazySysDiagnosticModal = lazy(() => import('./components/SysDiagnosticModal/SysDiagnosticModal').then((m) => ({ default: m.SysDiagnosticModal })));
const LazyCaseStudyModal = lazy(() => import('./components/CaseStudyModal/CaseStudyModal').then((m) => ({ default: m.CaseStudyModal })));

export interface AppRoutesOverride {
  WorksPage?: React.ComponentType<{ onSelectProject?: (id: string) => void }>;
  FoundationPage?: React.ComponentType;
  ResumePage?: React.ComponentType;
  ContactPage?: React.ComponentType;
  NotFoundPage?: React.ComponentType<{ onNavigate?: (path: string) => void }>;
}

interface AppProps {
  initialPath?: string;
  routes?: AppRoutesOverride;
}

export default function App({ initialPath, routes }: AppProps) {
  const { currentPath, navigate } = useRouter(initialPath);
  const [displayPath, setDisplayPath] = useState(currentPath);
  const [sysCheckOpen, setSysCheckOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const isFirstMount = useRef(true);

  useScrollLock(Boolean(selectedProject) || sysCheckOpen);

  useEffect(() => {
    return initCursor();
  }, []);

  // Top-level motion system entry point (StrictMode safe)
  useEffect(() => {
    return initMotion();
  }, [displayPath]);

  const prevPathRef = useRef(currentPath);

  // Micro-interaction 8: Route change (fade <main> out 0.2s / in 0.3s)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (prevPathRef.current === currentPath) return;
    prevPathRef.current = currentPath;

    const mainEl = mainRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!mainEl || reduce) {
      setDisplayPath(currentPath);
      window.scrollTo({ top: 0, behavior: 'instant' });
      ScrollTrigger.refresh();
      return;
    }

    // Fade <main> out 0.2s, swap route, then fade <main> in 0.3s
    gsap.killTweensOf(mainEl);
    gsap.to(mainEl, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        setDisplayPath(currentPath);
        window.scrollTo({ top: 0, behavior: 'instant' });
        gsap.fromTo(
          mainEl,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => {
              ScrollTrigger.refresh();
            },
          }
        );
      },
    });
  }, [currentPath]);

  useEffect(() => {
    const handleOpenSys = () => setSysCheckOpen(true);
    const handleOpenProject = (e: Event) => {
      const custom = e as CustomEvent<string>;
      const p = projects.find((proj) => proj.id === custom.detail);
      if (p) setSelectedProject(p);
    };

    window.addEventListener('open-sys-diagnostic', handleOpenSys);
    window.addEventListener('open-project-modal', handleOpenProject);

    return () => {
      window.removeEventListener('open-sys-diagnostic', handleOpenSys);
      window.removeEventListener('open-project-modal', handleOpenProject);
    };
  }, []);

  const handleSelectProjectById = (projectId: string) => {
    const p = projects.find((proj) => proj.id === projectId);
    if (p) setSelectedProject(p);
  };

  const Works = routes?.WorksPage || LazyWorksPage;
  const Foundation = routes?.FoundationPage || LazyFoundationPage;
  const Resume = routes?.ResumePage || LazyResumePage;
  const Contact = routes?.ContactPage || LazyContactPage;
  const NotFound = routes?.NotFoundPage || LazyNotFoundPage;

  return (
    <>
      <a href="#main-content" className="skipLink">
        Skip to main content
      </a>
      <Suspense fallback={null}>
        {sysCheckOpen && <LazySysDiagnosticModal isOpen={sysCheckOpen} onClose={() => setSysCheckOpen(false)} />}
        {selectedProject && <LazyCaseStudyModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
      </Suspense>
      <Nav currentPath={currentPath} onNavigate={navigate} />

      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        style={{ position: 'relative', zIndex: 1, minHeight: '100vh', outline: 'none' }}
      >
        <Suspense fallback={<div style={{ minHeight: '80vh' }} />}>
          {displayPath === '/' && (
            <HomePage onNavigate={navigate} onSelectProject={handleSelectProjectById} />
          )}
          {displayPath === '/works' && (
            <Works onSelectProject={handleSelectProjectById} />
          )}
          {displayPath === '/foundation' && <Foundation />}
          {displayPath === '/resume' && <Resume />}
          {displayPath === '/contact' && <Contact />}
          {displayPath === '/404' && <NotFound onNavigate={navigate} />}
        </Suspense>
      </main>
    </>
  );
}

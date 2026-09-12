import React, { useEffect, useState, lazy, Suspense } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useRouter } from './hooks/useRouter';
import { useReducedMotion } from './hooks/useReducedMotion';
import { projects, type ProjectData } from './data/projects';
import { SignalSweep } from './components/SignalSweep/SignalSweep';
import { CanvasGrid } from './components/CanvasGrid/CanvasGrid';
import { CustomCursor } from './components/CustomCursor/CustomCursor';
import { ShortcutsDock } from './components/ShortcutsDock/ShortcutsDock';
import { Nav } from './components/Nav/Nav';
import { HomePage } from './pages/Home/HomePage';
import { registerLenis, useScrollLock } from './utils/scrollLock';

// Lazy-loaded routes & modals for client code-splitting
const LazyWorksPage = lazy(() => import('./pages/Works/WorksPage').then((m) => ({ default: m.WorksPage })));
const LazyFoundationPage = lazy(() => import('./pages/Foundation/FoundationPage').then((m) => ({ default: m.FoundationPage })));
const LazyResumePage = lazy(() => import('./pages/Resume/ResumePage').then((m) => ({ default: m.ResumePage })));
const LazyContactPage = lazy(() => import('./pages/Contact/ContactPage').then((m) => ({ default: m.ContactPage })));
const LazySysDiagnosticModal = lazy(() => import('./components/SysDiagnosticModal/SysDiagnosticModal').then((m) => ({ default: m.SysDiagnosticModal })));
const LazyCaseStudyModal = lazy(() => import('./components/CaseStudyModal/CaseStudyModal').then((m) => ({ default: m.CaseStudyModal })));

export interface AppRoutesOverride {
  WorksPage?: React.ComponentType<{ onSelectProject?: (id: string) => void }>;
  FoundationPage?: React.ComponentType;
  ResumePage?: React.ComponentType;
  ContactPage?: React.ComponentType;
}

interface AppProps {
  initialPath?: string;
  routes?: AppRoutesOverride;
}

export default function App({ initialPath, routes }: AppProps) {
  const prefersReducedMotion = useReducedMotion();
  const { currentPath, navigate } = useRouter(initialPath);
  const [sysCheckOpen, setSysCheckOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  useScrollLock(Boolean(selectedProject) || sysCheckOpen);

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

  useEffect(() => {
    if (prefersReducedMotion) {
      registerLenis(null);
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    registerLenis(lenis);
    (window as any).__lenis = lenis;

    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      registerLenis(null);
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  const handleSelectProjectById = (projectId: string) => {
    const p = projects.find((proj) => proj.id === projectId);
    if (p) setSelectedProject(p);
  };

  const Works = routes?.WorksPage || LazyWorksPage;
  const Foundation = routes?.FoundationPage || LazyFoundationPage;
  const Resume = routes?.ResumePage || LazyResumePage;
  const Contact = routes?.ContactPage || LazyContactPage;

  return (
    <>
      <CanvasGrid />
      <CustomCursor />
      <ShortcutsDock />
      <Suspense fallback={null}>
        {sysCheckOpen && <LazySysDiagnosticModal isOpen={sysCheckOpen} onClose={() => setSysCheckOpen(false)} />}
        {selectedProject && <LazyCaseStudyModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
      </Suspense>
      <Nav currentPath={currentPath} onNavigate={navigate} />

      <SignalSweep>
        <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <Suspense fallback={<div style={{ minHeight: '80vh' }} />}>
            {currentPath === '/' && (
              <HomePage onNavigate={navigate} onSelectProject={handleSelectProjectById} />
            )}
            {currentPath === '/works' && (
              <Works onSelectProject={handleSelectProjectById} />
            )}
            {currentPath === '/foundation' && <Foundation />}
            {currentPath === '/resume' && <Resume />}
            {currentPath === '/contact' && <Contact />}
          </Suspense>
        </main>
      </SignalSweep>
    </>
  );
}

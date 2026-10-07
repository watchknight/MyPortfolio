import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from './hooks/useRouter';
import { projects, type ProjectData } from './data/projects';
import { initCursor } from './motion/cursor';
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
  const [sysCheckOpen, setSysCheckOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  useScrollLock(Boolean(selectedProject) || sysCheckOpen);

  useEffect(() => {
    return initCursor();
  }, []);

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
        id="main-content"
        tabIndex={-1}
        style={{ position: 'relative', zIndex: 1, minHeight: '100vh', outline: 'none' }}
      >
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
          {currentPath === '/404' && <NotFound onNavigate={navigate} />}
        </Suspense>
      </main>
    </>
  );
}

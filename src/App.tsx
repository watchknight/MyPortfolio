import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useRouter } from './hooks/useRouter';
import { useReducedMotion } from './hooks/useReducedMotion';
import { projects, type ProjectData } from './data/projects';
import { SignalSweep } from './components/SignalSweep/SignalSweep';
import { CanvasGrid } from './components/CanvasGrid/CanvasGrid';
import { CustomCursor } from './components/CustomCursor/CustomCursor';
import { ShortcutsDock } from './components/ShortcutsDock/ShortcutsDock';
import { SysDiagnosticModal } from './components/SysDiagnosticModal/SysDiagnosticModal';
import { CaseStudyModal } from './components/CaseStudyModal/CaseStudyModal';
import { Nav } from './components/Nav/Nav';

import { HomePage } from './pages/Home/HomePage';
import { WorksPage } from './pages/Works/WorksPage';
import { FoundationPage } from './pages/Foundation/FoundationPage';
import { ResumePage } from './pages/Resume/ResumePage';
import { ContactPage } from './pages/Contact/ContactPage';

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const { currentPath, navigate } = useRouter();
  const [sysCheckOpen, setSysCheckOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

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
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  const handleSelectProjectById = (projectId: string) => {
    const p = projects.find((proj) => proj.id === projectId);
    if (p) setSelectedProject(p);
  };

  return (
    <>
      <CanvasGrid />
      <CustomCursor />
      <ShortcutsDock />
      <SysDiagnosticModal isOpen={sysCheckOpen} onClose={() => setSysCheckOpen(false)} />
      <CaseStudyModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      <Nav currentPath={currentPath} onNavigate={navigate} />

      <SignalSweep>
        <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          {currentPath === '/' && (
            <HomePage onNavigate={navigate} onSelectProject={handleSelectProjectById} />
          )}
          {currentPath === '/works' && (
            <WorksPage onSelectProject={handleSelectProjectById} />
          )}
          {currentPath === '/foundation' && <FoundationPage />}
          {currentPath === '/resume' && <ResumePage />}
          {currentPath === '/contact' && <ContactPage />}
        </main>
      </SignalSweep>
    </>
  );
}

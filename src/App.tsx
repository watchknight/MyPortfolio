import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useRouter } from './hooks/useRouter';
import { projects, type ProjectData } from './data/projects';
import { initCursor } from './motion/cursor';
import { initAtmosphere } from './motion/atmosphere.js';
import { initMotion, ScrollTrigger, gsap, initTileReveals } from './motion/index';
import { sound, initSound } from './audio/sound.js';
import { initSoundHooks, initSections } from './audio/hooks.js';
import { refreshSections } from './lib/sections.js';
import { migrateOldSoundStorage } from './utils/audio';
import { Nav } from './components/Nav/Nav';
import { FooterBand } from './components/FooterBand/FooterBand';
import { HomePage } from './pages/Home/HomePage';
import { KernelBoot } from './components/KernelBoot/KernelBoot';
import { useScrollLock } from './utils/scrollLock';

import { WorksPage } from './pages/Works/WorksPage';
import { FoundationPage } from './pages/Foundation/FoundationPage';
import { ResumePage } from './pages/Resume/ResumePage';
import { ContactPage } from './pages/Contact/ContactPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

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

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Abdur Rahman Moayed — Software Engineer & Systems Architect',
  '/works': 'Selected Works & Engineering Systems — Abdur Rahman Moayed',
  '/foundation': 'Academic Background & Technical Skills — Abdur Rahman Moayed',
  '/resume': 'Curriculum Vitae (Résumé) — Abdur Rahman Moayed',
  '/contact': 'Get in Touch & Direct Contact — Abdur Rahman Moayed',
  '/404': 'Signal Void // 404 — Abdur Rahman Moayed',
};

function updateDocumentTitle(path: string) {
  if (typeof document !== 'undefined') {
    const title = ROUTE_TITLES[path] || ROUTE_TITLES['/404'];
    if (title && document.title !== title) {
      document.title = title;
    }
  }
}

function getSectionForPath(path: string): string | undefined {
  switch (path) {
    case '/works':
      return 'work';
    case '/foundation':
      return 'about';
    case '/resume':
      return 'hero';
    case '/contact':
      return 'contact';
    default:
      return undefined;
  }
}

export default function App({ initialPath, routes }: AppProps) {
  const { currentPath, navigate } = useRouter(initialPath);
  const [displayPath, setDisplayPath] = useState(currentPath);
  const [sysCheckOpen, setSysCheckOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const isFirstMount = useRef(true);
  const isFirstSysMount = useRef(true);
  const audioInitializedRef = useRef(false);

  useScrollLock(Boolean(selectedProject) || sysCheckOpen);

  useEffect(() => {
    return initCursor();
  }, []);

  useEffect(() => {
    return initAtmosphere();
  }, []);

  // Top-level audio system initialization (client-side only, runs once)
  useEffect(() => {
    if (audioInitializedRef.current) return;
    audioInitializedRef.current = true;
    migrateOldSoundStorage();
    initSound();
    initSoundHooks();
    initSections();
  }, []);

  // Sys switch open / close sound
  useEffect(() => {
    if (isFirstSysMount.current) {
      isFirstSysMount.current = false;
      return;
    }
    sound.play('toggle', { on: sysCheckOpen });
  }, [sysCheckOpen]);

  // Top-level motion system entry point (runs once)
  useEffect(() => {
    return initMotion();
  }, []);

  // Close any open modals on route change
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setSelectedProject((prev) => (prev ? null : prev));
    setSysCheckOpen((prev) => (prev ? false : prev));
  }, [currentPath]);

  // Effect on displayPath: refresh sections after the new route DOM exists
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        const el = document.querySelector(window.location.hash);
        if (el) {
          el.scrollIntoView({ behavior: 'instant' });
        }
      } catch {}
    }
    refreshSections();
    ScrollTrigger.refresh();
  }, [displayPath]);

  const prevPathRef = useRef(currentPath);

  // Micro-interaction 8: Route change (fade <main> out 0.2s / in 0.3s)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      updateDocumentTitle(currentPath);
      return;
    }
    if (prevPathRef.current === currentPath) return;
    prevPathRef.current = currentPath;

    sound.play('swish', { dir: 1, vel: 0.6 });

    const mainEl = mainRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!mainEl || reduce) {
      setDisplayPath(currentPath);
      if (typeof window !== 'undefined' && !window.location.hash) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      updateDocumentTitle(currentPath);
      mainEl?.focus({ preventScroll: true });
      if (mainEl) initTileReveals(mainEl);
      ScrollTrigger.refresh();
      refreshSections();
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
        if (typeof window !== 'undefined' && !window.location.hash) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        updateDocumentTitle(currentPath);
        mainEl.focus({ preventScroll: true });
        gsap.fromTo(
          mainEl,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => {
              initTileReveals(mainEl);
              ScrollTrigger.refresh();
              refreshSections();
            },
          }
        );
      },
    });

    return () => {
      if (mainEl) gsap.killTweensOf(mainEl);
    };
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

  const Works = routes?.WorksPage || WorksPage;
  const Foundation = routes?.FoundationPage || FoundationPage;
  const Resume = routes?.ResumePage || ResumePage;
  const Contact = routes?.ContactPage || ContactPage;
  const NotFound = routes?.NotFoundPage || NotFoundPage;

  return (
    <>
      <div className="atmo" aria-hidden="true">
        <div className="atmo__blob atmo__blob--a"><div className="atmo__layer" /></div>
        <div className="atmo__blob atmo__blob--b"><div className="atmo__layer" /></div>
        <div className="atmo__blob atmo__blob--c"><div className="atmo__layer" /></div>
        <div className="atmo__pointer" />
        <div className="atmo__grain" />
      </div>
      <a href="#main-content" className="skipLink">
        Skip to main content
      </a>
      <Suspense fallback={null}>
        {sysCheckOpen && <LazySysDiagnosticModal isOpen={sysCheckOpen} onClose={() => setSysCheckOpen(false)} />}
        {selectedProject && <LazyCaseStudyModal key={selectedProject.id} project={selectedProject} onClose={() => setSelectedProject(null)} />}
      </Suspense>
      <KernelBoot />
      <Nav currentPath={currentPath} onNavigate={navigate} />

      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        data-section={getSectionForPath(displayPath)}
      >
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
      </main>

      <FooterBand
        showCta={displayPath !== '/contact' && displayPath !== '/404'}
        onNavigate={navigate}
      />
    </>
  );
}

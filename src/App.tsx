import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useReducedMotion } from './hooks/useReducedMotion';
import { SignalSweep } from './components/SignalSweep/SignalSweep';
import { CanvasGrid } from './components/CanvasGrid/CanvasGrid';
import { CustomCursor } from './components/CustomCursor/CustomCursor';
import { ShortcutsDock } from './components/ShortcutsDock/ShortcutsDock';
import { WaypointDock } from './components/WaypointDock/WaypointDock';
import { SysDiagnosticModal } from './components/SysDiagnosticModal/SysDiagnosticModal';
import { Nav } from './components/Nav/Nav';
import { Hero } from './components/Hero/Hero';
import { TelemetryRibbon } from './components/TelemetryRibbon/TelemetryRibbon';
import { CaseStudies } from './components/CaseStudy/CaseStudy';
import { Foundation } from './components/Foundation/Foundation';
import { Contact } from './components/Contact/Contact';

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [sysCheckOpen, setSysCheckOpen] = useState(false);

  useEffect(() => {
    const handleOpenSys = () => setSysCheckOpen(true);
    window.addEventListener('open-sys-diagnostic', handleOpenSys);
    return () => window.removeEventListener('open-sys-diagnostic', handleOpenSys);
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

  return (
    <>
      <CanvasGrid />
      <CustomCursor />
      <ShortcutsDock />
      <WaypointDock onOpenSysCheck={() => setSysCheckOpen(true)} />
      <SysDiagnosticModal isOpen={sysCheckOpen} onClose={() => setSysCheckOpen(false)} />
      <Nav />
      <SignalSweep>
        <main style={{ position: 'relative', zIndex: 1 }}>
          <Hero />
          <TelemetryRibbon />
          <CaseStudies />
          <Foundation />
          <Contact />
        </main>
      </SignalSweep>
    </>
  );
}

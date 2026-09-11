import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useReducedMotion } from './hooks/useReducedMotion';
import { SignalSweep } from './components/SignalSweep/SignalSweep';
import { CanvasGrid } from './components/CanvasGrid/CanvasGrid';
import { CustomCursor } from './components/CustomCursor/CustomCursor';
import { Nav } from './components/Nav/Nav';
import { Hero } from './components/Hero/Hero';
import { CaseStudies } from './components/CaseStudy/CaseStudy';
import { Foundation } from './components/Foundation/Foundation';
import { Contact } from './components/Contact/Contact';

export default function App() {
  const prefersReducedMotion = useReducedMotion();

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
      <Nav />
      <SignalSweep>
        <main style={{ position: 'relative', zIndex: 1 }}>
          <Hero />
          <CaseStudies />
          <Foundation />
          <Contact />
        </main>
      </SignalSweep>
    </>
  );
}

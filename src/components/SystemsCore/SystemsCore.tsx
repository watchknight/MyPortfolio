import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { sound } from '../../audio/sound.js';
import styles from './SystemsCore.module.css';

export const SystemsCore: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stateLabel, setStateLabel] = useState<'COHERENT' | 'EXPLODED'>('COHERENT');

  const animStateRef = useRef({
    targetExpansion: 0,
    currentExpansion: 0,
    burst: 0,
    targetRotX: 0,
    targetRotY: 0,
    currentRotX: 0,
    currentRotY: 0,
    isInView: true,
    isTabVisible: true,
    reduceMotion: false,
  });

  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBurst = useCallback(() => {
    // Accumulate impulse smoothly without geometry clipping
    animStateRef.current.burst = Math.min(animStateRef.current.burst + 0.75, 1.8);
    sound.play('pluck', { vel: 0.7 });
    setStateLabel('EXPLODED');
    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
    }
    burstTimerRef.current = setTimeout(() => {
      setStateLabel('COHERENT');
      burstTimerRef.current = null;
    }, 800);
  }, []);

  const handlePointerEnter = useCallback(() => {
    animStateRef.current.targetExpansion = 0.6;
    sound.play('tick', { vel: 0.2 });
  }, []);

  const handlePointerLeave = useCallback(() => {
    animStateRef.current.targetExpansion = 0;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    const container = mountRef.current;
    if (!canvas || !container) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    animStateRef.current.reduceMotion = reduceMotion;

    // Renderer setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    } catch {
      // WebGL unsupported fallback
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.2;

    const isLight = document.documentElement.dataset.theme === 'light';
    const lineColor = isLight ? 0x7684a6 : 0x5f78b2;
    const coreLineColor = isLight ? 0xd3dae9 : 0x263a6a;
    const amberColor = 0xffb224;
    const okColor = isLight ? 0x0b7a4b : 0x5bd6a0;

    // Materials
    const outerLineMat = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.6,
    });

    const innerLineMat = new THREE.LineBasicMaterial({
      color: coreLineColor,
      transparent: true,
      opacity: 0.85,
    });

    const outerPointsMat = new THREE.PointsMaterial({
      color: amberColor,
      size: 0.08,
    });

    const innerPointsMat = new THREE.PointsMaterial({
      color: okColor,
      size: 0.06,
    });

    const nucleusMat = new THREE.MeshBasicMaterial({
      color: amberColor,
      wireframe: true,
    });

    // Geometries
    const outerGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const outerWire = new THREE.WireframeGeometry(outerGeo);
    const innerGeo = new THREE.OctahedronGeometry(0.7, 0);
    const innerWire = new THREE.WireframeGeometry(innerGeo);
    const nucleusGeo = new THREE.IcosahedronGeometry(0.25, 0);

    // Assembly groups
    const rootGroup = new THREE.Group();
    const outerGroup = new THREE.Group();
    const coreGroup = new THREE.Group();

    const outerMesh = new THREE.LineSegments(outerWire, outerLineMat);
    const outerPoints = new THREE.Points(outerGeo, outerPointsMat);
    outerGroup.add(outerMesh);
    outerGroup.add(outerPoints);

    // Orbital ring
    const ringPoints: THREE.Vector3[] = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      ringPoints.push(new THREE.Vector3(Math.cos(theta) * 1.45, Math.sin(theta) * 1.45, 0));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
    const ringMat = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.35,
    });
    const orbitalRing = new THREE.Line(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI / 3;
    outerGroup.add(orbitalRing);

    const innerMesh = new THREE.LineSegments(innerWire, innerLineMat);
    const innerPoints = new THREE.Points(innerGeo, innerPointsMat);
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(innerMesh);
    coreGroup.add(innerPoints);
    coreGroup.add(nucleus);

    rootGroup.add(outerGroup);
    rootGroup.add(coreGroup);
    scene.add(rootGroup);

    // Resize handler
    const updateSize = () => {
      const width = container.clientWidth || 240;
      const height = container.clientHeight || 180;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      if (animStateRef.current.reduceMotion) {
        renderer.render(scene, camera);
      }
    });
    resizeObserver.observe(container);

    // Clamped cursor tracking (gracefully inclines core toward pointer without flipping)
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const normX = Math.max(-1.5, Math.min(1.5, (e.clientX - cx) / (window.innerWidth * 0.45)));
      const normY = Math.max(-1.5, Math.min(1.5, (e.clientY - cy) / (window.innerHeight * 0.45)));
      animStateRef.current.targetRotX = -normY * 0.45;
      animStateRef.current.targetRotY = normX * 0.45;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // WebGL Context Loss Prevention
    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    canvas.addEventListener('webglcontextlost', onContextLost, false);

    // Dynamic prefers-reduced-motion listener
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      animStateRef.current.reduceMotion = e.matches;
      if (e.matches) {
        cancelAnimationFrame(animId);
        renderer.render(scene, camera);
      } else {
        animId = requestAnimationFrame(render);
      }
    };
    motionQuery?.addEventListener('change', handleMotionChange);

    // IntersectionObserver to pause loop off-screen
    const io = new IntersectionObserver(([entry]) => {
      animStateRef.current.isInView = entry.isIntersecting;
    });
    io.observe(container);

    // Visibility change handler
    const handleVis = () => {
      animStateRef.current.isTabVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVis);

    // Theme change observer
    const themeObserver = new MutationObserver(() => {
      const light = document.documentElement.dataset.theme === 'light';
      outerLineMat.color.setHex(light ? 0x7684a6 : 0x5f78b2);
      innerLineMat.color.setHex(light ? 0xd3dae9 : 0x263a6a);
      ringMat.color.setHex(light ? 0x7684a6 : 0x5f78b2);
      innerPointsMat.color.setHex(light ? 0x0b7a4b : 0x5bd6a0);
      if (animStateRef.current.reduceMotion) {
        renderer.render(scene, camera);
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Render loop
    let animId: number;
    const render = () => {
      animId = requestAnimationFrame(render);

      const state = animStateRef.current;
      if (!state.isInView || !state.isTabVisible || state.reduceMotion) {
        return;
      }

      // Smooth lerp rotation toward cursor
      state.currentRotX += (state.targetRotX - state.currentRotX) * 0.08;
      state.currentRotY += (state.targetRotY - state.currentRotY) * 0.08;
      rootGroup.rotation.x = state.currentRotX;
      rootGroup.rotation.y = state.currentRotY;

      // Expansion / disassembly lerp
      state.currentExpansion += (state.targetExpansion - state.currentExpansion) * 0.08;
      state.burst *= 0.91; // decay burst

      const totalExplode = state.currentExpansion + state.burst * 0.8;
      outerGroup.scale.setScalar(1 + totalExplode * 0.38);
      coreGroup.scale.setScalar(1 - totalExplode * 0.12);

      // Ambient idle rotations
      outerGroup.rotation.y += 0.0035;
      orbitalRing.rotation.z += 0.005;
      coreGroup.rotation.y -= 0.006;
      coreGroup.rotation.x += 0.002;

      renderer.render(scene, camera);
    };

    if (reduceMotion) {
      renderer.render(scene, camera);
    } else {
      animId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      motionQuery?.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVis);
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
      }

      // Scene disposal
      outerGeo.dispose();
      outerWire.dispose();
      innerGeo.dispose();
      innerWire.dispose();
      nucleusGeo.dispose();
      ringGeo.dispose();

      outerLineMat.dispose();
      innerLineMat.dispose();
      outerPointsMat.dispose();
      innerPointsMat.dispose();
      nucleusMat.dispose();
      ringMat.dispose();

      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={styles.container}
      onClick={triggerBurst}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      data-cursor="inspect"
      data-cursor-label="BURST // 0x7E"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerBurst();
        }
      }}
      aria-label="Interactive 3D Systems Core AST Lattice"
    >
      <div className={styles.hudHeader}>
        <span className={styles.statusIndicator}>
          <span className={styles.statusDot} />
          AST_LATTICE
        </span>
        <span>0x7E3 // V8</span>
      </div>

      <div className={styles.canvasWrapper}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <div className={styles.hudFooter}>
        <span className={styles.stateTag}>{stateLabel}</span>
        <span className={styles.actionHint}>CLICK TO EXPLODE</span>
      </div>
    </div>
  );
};

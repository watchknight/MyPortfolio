export interface Intervention {
  name: string;
  cause: string;
  fix: string;
}

export interface ProjectData {
  id: string;
  title: string;
  subtitle: string;
  role: string;
  category: string;
  domain: string;
  likes: number;
  metric: {
    label: string;
    value: string;
  };
  environment: string[];
  problem: string;
  architecture: string;
  interventions: Intervention[];
  codeHighlight?: {
    filename: string;
    language: string;
    code: string;
    explanation: string;
  };
  repository: string;
  liveUrl?: string;
}

export const projects: ProjectData[] = [
  {
    id: 'purefeed',
    title: 'PureFeed',
    subtitle: 'Browser engine and anti-adblock countermeasures',
    role: 'Lead Systems & Extension Engineer',
    category: 'Browser Internals & Security',
    domain: 'purefeed.engine',
    likes: 48,
    metric: {
      label: 'Detection Skip',
      value: '<16ms',
    },
    environment: ['Chromium Manifest V3', 'JavaScript', 'HTML5 Media', 'Netlify'],
    problem:
      'YouTube and Facebook rely on recursive player loops, strict Content Security Policies, and dynamic DOM obfuscation to bypass ad blockers and keep users trapped in algorithmic feeds.',
    architecture:
      'Decoupled hybrid engine separating network-level declarative filtering from in-player runtime execution, using Manifest V3 Main World registration to bridge execution states.',
    interventions: [
      {
        name: 'The 15-Second Black Screen Trap',
        cause:
          'A 20ms fast-forward interval continuously reset currentTime to 14.99 seconds, trapping the player on the final ad frame for the full duration.',
        fix:
          'Implemented a single-entry state guard that seeks to video duration once and hands control back to the native HTML5 ended event.',
      },
      {
        name: 'Manifest V3 CSP Isolation',
        cause:
          "YouTube's strict script-src 'self' header blocked inline script injection from the extension's isolated world.",
        fix:
          'Registered the engine directly in the Main World and established a zero-latency, CSP-compliant communication pipe using dataset attributes on the HTML document root.',
      },
      {
        name: 'Facebook Obfuscated Sponsored Evasion',
        cause:
          'Facebook hides sponsored tags using zero-width Unicode characters, randomized DOM node order, and invisible canvas element clusters.',
        fix:
          'Built a recursive tree-walker with anagram frequency matching and a 300-entry FIFO cache that unmasks sponsored posts while maintaining 60fps scrolling performance.',
      },
    ],
    codeHighlight: {
      filename: 'youtube-main.js & facebook.js',
      language: 'javascript',
      code: `// Main-World State Bridge bypassing MV3 CSP
const isBlocked = document.documentElement.dataset.purefeedYtAds === 'true';

// Anagram Frequency Normalization defeating scrambled 'Sponsored' DOM
function isSponsoredText(cleanText) {
  return cleanText.toLowerCase().split('').sort().join('') === 'ddenoorpss';
}`,
      explanation:
        'Uses the HTML root dataset as a zero-latency CSP-compliant message channel between worlds, paired with letter-frequency sorting to detect scrambled DOM strings.',
    },
    repository: 'https://github.com/watchknight/PureFeed',
  },
  {
    id: 'focusguard',
    title: 'FocusGuard',
    subtitle: 'Multi-layer network and operating-system policy enforcement',
    role: 'Systems & Security Engineer',
    category: 'Systems Engineering & Security',
    domain: 'focusguard.sys',
    likes: 34,
    metric: {
      label: 'OS Rules',
      value: '580+ hosts',
    },
    environment: ['Chrome Extension APIs', 'Windows System APIs', 'Windows Registry', 'Node.js'],
    problem:
      'Single-layer browser extensions fail because users can easily disable them, switch browsers, or change network adapters to bypass restrictions.',
    architecture:
      '5-tier enforcement matrix synchronizing browser-level declarativeNetRequest rules with OS-level hosts file routing, Windows Registry policy locks, and an independent background watchdog service.',
    interventions: [
      {
        name: 'Operating-System Level Redirection',
        cause:
          'Browser-only blocking leaves the system exposed when extensions are disabled or alternative browsers are used.',
        fix:
          'Mapped over 580 domains directly to 0.0.0.0 in the Windows hosts file, blocking traffic across all desktop browsers and third-party software.',
      },
      {
        name: 'SafeSearch Enterprise Policies',
        cause:
          'Users can manually disable SafeSearch in browser settings, circumventing content filtering entirely.',
        fix:
          'Injected mandatory registry policies into Chrome and Edge to lock SafeSearch to active, routing search queries to dedicated SafeSearch VIP IP addresses.',
      },
      {
        name: 'Automated Background Watchdog',
        cause:
          'System-level configurations can be manually edited or reverted by technically knowledgeable users.',
        fix:
          'Built a background Windows service that monitors DNS configurations and hosts files every 60 seconds, immediately restoring any rules that are modified or removed.',
      },
    ],
    codeHighlight: {
      filename: 'background.js & setup.ps1',
      language: 'powershell',
      code: `# Windows Registry Enterprise Policy Injection
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome" -Name "ForceGoogleSafeSearch" -Value 1 -Type DWord
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge" -Name "ForceGoogleSafeSearch" -Value 1 -Type DWord`,
      explanation:
        'Locks browser-level SafeSearch toggles at the machine policy layer, rendering client-side bypass attempts ineffective across all Chromium browsers.',
    },
    repository: 'https://github.com/watchknight/FocusGuard',
  },
  {
    id: 'rannabanna',
    title: 'Rannabanna',
    subtitle: 'Heuristic matchmaking engine and non-linear scaling physics',
    role: 'Full-Stack Architect & Algorithm Designer',
    category: 'Algorithms & Database Systems',
    domain: 'rannabanna.app',
    likes: 29,
    metric: {
      label: 'Heuristic Pass',
      value: '0.8ms SQL',
    },
    environment: ['React', 'Node.js', 'SQLite', 'Gemini 3.8 Flash API'],
    problem:
      'Conventional recipe applications rely on strict database queries that fail when ingredients are missing, or they trigger combinatorial performance bottlenecks when calculating ingredient combinations across large catalogs.',
    architecture:
      'Relational junction graph over SQLite paired with a weighted set-intersection scoring engine and a SHA-256 hashed tiered caching layer for LLM-driven bilingual localization.',
    interventions: [
      {
        name: 'Heuristic Scoring Pipeline',
        cause:
          'Subset permutation across 395+ recipes would cause combinatorial explosion and unacceptable latency.',
        fix:
          'Built a weighted scoring engine that prioritizes essential ingredients over garnishes and calculates pantry shortfalls, returning filtered recipe tiers in under 5 milliseconds.',
      },
      {
        name: 'Non-Linear Cooking Physics',
        cause:
          'Cooking durations do not scale linearly with serving counts — doubling servings does not double cook time.',
        fix:
          'Implemented practical culinary formulas: scaling prep time by the square root of the serving ratio, capping cook times with a logarithmic curve, and rounding countable ingredients into usable kitchen ranges.',
      },
      {
        name: 'Gemini 3.8 Flash Translation Cache',
        cause:
          'Uncached LLM translation calls for Bengali localization introduce latency and unnecessary API costs.',
        fix:
          'Integrated a SHA-256 hashed dual-cache architecture, reading translations from SQLite and in-memory caches to eliminate redundant network requests.',
      },
    ],
    codeHighlight: {
      filename: 'recipeService.ts',
      language: 'typescript',
      code: `// Non-Linear Diminishing-Returns Cooking Physics
const prepRatio = Math.sqrt(targetServings / baseServings);
const scaledPrepTime = Math.round(basePrepTime * prepRatio);
const scaledCookTime = Math.round(baseCookTime * Math.min(1.3, 1 + 0.15 * Math.log2(targetServings / baseServings)));`,
      explanation:
        'Applies logarithmic and square-root scaling to recipe prep and cook times, preventing mathematical distortion when adjusting serving counts.',
    },
    repository: 'https://github.com/watchknight/Rannabanna',
  },
  {
    id: 'doclensbd',
    title: 'DocLensBD',
    subtitle: 'Real-time computer vision virtual try-on and optical storefront',
    role: 'Frontend & Computer Vision Engineer',
    category: 'Computer Vision & Optical Frontend',
    domain: 'doclensbd.ai',
    likes: 41,
    metric: {
      label: 'Landmark Rate',
      value: '60 FPS',
    },
    environment: ['React', 'TypeScript', 'MediaPipe Face Mesh', 'Tailwind CSS', 'Netlify'],
    problem:
      'Optical retail e-commerce suffers from frame fit uncertainty and sluggish specification filtering, leading to high return rates and customer drop-off.',
    architecture:
      'Client-side optical storefront integrating Google MediaPipe Face Mesh for 6DOF landmark tracking, webcam streaming, and real-time canvas glasses rendering paired with zero-shift faceted product filtering.',
    interventions: [
      {
        name: 'Real-Time Facial Landmark Mesh',
        cause:
          'Traditional 2D image overlays fail when users turn their heads or move closer to the camera.',
        fix:
          'Integrated MediaPipe Face Mesh to extract 468 facial landmark coordinates in real time, calculating inter-pupillary distance and 3D head yaw/pitch/roll angles.',
      },
      {
        name: '6DOF Landmark Coordinate Smoothing',
        cause:
          'Raw camera feed jitter causes glasses models to vibrate erratically on screen.',
        fix:
          'Implemented a weighted temporal smoothing filter (smoothedRef) that interpolates landmark coordinates across consecutive video frames to deliver stable 60fps rendering.',
      },
      {
        name: 'Faceted Frame Geometry Filtering',
        cause:
          'High-density optical catalogs cause layout shifts and slow response times during multi-attribute searches.',
        fix:
          'Built an instantaneous client-side filter engine categorizing products by frame shape, rim type, bridge width, and lens material with zero layout shift.',
      },
    ],
    codeHighlight: {
      filename: 'VirtualTryOn.tsx',
      language: 'typescript',
      code: `// 6DOF Landmark Smoothing Filter for Optical Canvas
const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
const currentWidth = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y) * 2.2;
smoothedRef.current = {
  x: smoothed.x * 0.7 + targetX * 0.3,
  y: smoothed.y * 0.7 + targetY * 0.3,
  angle: smoothed.angle * 0.8 + angle * 0.2
};`,
      explanation:
        'Calculates real-time eye vector angles and applies temporal interpolation to eliminate camera frame jitter during 60fps virtual try-on.',
    },
    repository: 'https://github.com/watchknight/DocLensBD',
  },
  {
    id: 'poshra',
    title: 'POSHRA',
    subtitle: 'Scalable Next.js commerce architecture and regional payment pipeline',
    role: 'Full-Stack Engineer',
    category: 'Full-Stack Architecture & Payments',
    domain: 'poshra.store',
    likes: 36,
    metric: {
      label: 'Schema Gate',
      value: '100% Zod Safe',
    },
    environment: ['Next.js 16 (App Router)', 'React 19', 'Supabase (PostgreSQL)', 'Zustand', 'SSLCommerz'],
    problem:
      'Regional e-commerce applications frequently suffer from state desynchronization between tabs, unverified client transaction payloads, and brittle payment gateway handshakes.',
    architecture:
      'Full-stack Next.js App Router application powered by Supabase SSR, Zustand atomic cart persistence, strict Zod schema validation, and SSLCommerz regional payment processing.',
    interventions: [
      {
        name: 'Atomic Cart State Reconciliation',
        cause:
          'Multiple open browser tabs and abrupt page reloads cause cart quantity desynchronization and stale pricing calculations.',
        fix:
          'Architected an atomic Zustand store backed by localStorage hydration and optimistic UI mutations, ensuring instant feedback and consistent cart state across sessions.',
      },
      {
        name: 'Regional Payment Gateway Handshake',
        cause:
          'Domestic payment processing with gateways like SSLCommerz requires resilient transaction verification and asynchronous IPN callback handling.',
        fix:
          'Implemented a secure server-side verification pipeline with cryptographic signature validation and transactional order logging in PostgreSQL.',
      },
      {
        name: 'End-to-End Schema Validation',
        cause:
          'Malformed client payloads or unexpected database schema mutations introduce silent runtime crashes in the checkout flow.',
        fix:
          'Enforced Zod schemas at both the API boundary and data-access layers, guaranteeing type safety and valid order records before payment execution.',
      },
    ],
    codeHighlight: {
      filename: 'cartStore.ts',
      language: 'typescript',
      code: `// Atomic Cart State Machine with LocalStorage Sync
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => {
        const existing = get().items.find(i => i.product.id === product.id);
        set({ items: existing 
          ? get().items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
          : [...get().items, { product, quantity }]
        });
      }
    }),
    { name: 'poshra-cart-storage' }
  )
);`,
      explanation:
        'Provides atomic cart mutations with automatic client-side persistence, preventing lost transactions during network disconnects or page reloads.',
    },
    repository: 'https://github.com/watchknight/POSHRA',
  },
];

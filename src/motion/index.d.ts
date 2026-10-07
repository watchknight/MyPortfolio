import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";

export declare function initMotion(): () => void;
export declare function toggleTheme(
  next: 'dark' | 'light',
  x: number,
  y: number,
  apply: (next: 'dark' | 'light') => void
): void;

export { gsap, ScrollTrigger, SplitText, Flip };

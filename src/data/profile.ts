// Authoritative Profile & Candidate Data (SSOT)
// Shared across Terminal, Resume, Contact, Foundation, and Command Palette

export interface ContactInfo {
  email: string;
  github: string;
  githubUrl: string;
  linkedin: string;
  linkedinUrl: string;
  location: string;
  timezone: string;
  responseWindow: string;
  resumeUrl: string;
}

export interface SkillCategory {
  languages: string[];
  systems: string[];
  frontend: string[];
  backend: string[];
  tools: string[];
}

export interface ProfileData {
  name: string;
  handle: string;
  role: string;
  title: string;
  institution: string;
  degree: string;
  location: string;
  timezone: string;
  status: string;
  summary: string;
  bio: string;
  contact: ContactInfo;
  skills: SkillCategory;
  coursework: string[];
  distinctions: {
    title: string;
    level: string;
    year: string;
  }[];
}

export const profileData: ProfileData = {
  name: 'Abdur Rahman Moayed',
  handle: 'watchknight',
  role: 'Software Engineer & Systems Builder',
  title: 'Lead Systems & Frontend Software Engineer',
  institution: 'East West University (EWU)',
  degree: 'B.Sc. in Computer Science & Engineering (2025 — Present)',
  location: 'Dhaka, Bangladesh',
  timezone: 'Asia/Dhaka (UTC+6)',
  status: 'Available for Remote Software Engineering Internships & Roles',
  summary:
    'Computer Science undergraduate specializing in browser engine internals (MV3), OS-level security policies, real-time 3D computer vision (60 FPS), and low-overhead web architectures.',
  bio:
    'Specializing in browser internals, OS-level security countermeasures, and high-performance web systems.',
  contact: {
    email: 'armabdur.rahman04@gmail.com',
    github: 'github.com/watchknight',
    githubUrl: 'https://github.com/watchknight',
    linkedin: 'in/abdur-rahman-moayed',
    linkedinUrl: 'https://linkedin.com/in/abdur-rahman-moayed-9225b5389',
    location: 'Dhaka, Bangladesh',
    timezone: 'UTC+6 (Asia/Dhaka)',
    responseWindow: '< 24 Hours',
    resumeUrl: '/resume.pdf',
  },
  skills: {
    languages: ['TypeScript', 'JavaScript (ESNext)', 'Python', 'C', 'C++', 'HTML5', 'CSS3', 'SQL'],
    systems: ['Chromium Manifest V3', 'Windows Registry APIs', 'OS DNS Sockets', 'Web Audio DSP'],
    frontend: ['React 19', 'Next.js 16', 'Tailwind CSS', 'CSS Modules', 'Zustand', 'MediaPipe 3D'],
    backend: ['Node.js', 'Express', 'PostgreSQL', 'SQLite', 'REST APIs', 'SSE'],
    tools: ['Git', 'GitHub', 'Linux', 'Vite', 'Bash', 'Docker'],
  },
  coursework: [
    'Data Structures & Algorithms',
    'Operating Systems & Kernels',
    'Computer Networks & Protocols',
    'Database Management Systems',
    'Discrete Mathematics',
    'Theory of Computation',
    'Software Architecture & Design',
  ],
  distinctions: [
    { title: 'National Board General Merit Scholarship', level: 'SSC Class 10 (GPA 5.0)', year: '2021' },
    { title: 'National Board General Merit Scholarship', level: 'JSC Class 8 (GPA 5.0)', year: '2018' },
    { title: 'National Board Distinction', level: 'PSC Class 5 (GPA 5.0)', year: '2015' },
  ],
};

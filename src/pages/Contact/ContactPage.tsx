import React, { useState, useEffect } from 'react';
import { SpotlightCard } from '../../components/SpotlightCard/SpotlightCard';
import { ScrambleText } from '../../components/ScrambleText/ScrambleText';
import { sound } from '../../utils/audio';
import styles from './ContactPage.module.css';

export function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);
  const [dhakaTime, setDhakaTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    const updateTime = () => {
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date());
      setDhakaTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('armabdur.rahman04@gmail.com');
    setCopied(true);
    sound.playClick(900, 0.03, 0.08);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyDraft = () => {
    const draft = `To: armabdur.rahman04@gmail.com\nSubject: ${formData.subject || 'Project Inquiry'}\n\nName: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`;
    navigator.clipboard.writeText(draft);
    setDraftCopied(true);
    sound.playClick(900, 0.03, 0.08);
    setTimeout(() => setDraftCopied(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playChirp(600, 1100, 0.06, 0.08);
    setDispatched(true);

    const subjectLine = encodeURIComponent(
      formData.subject || `Inquiry from ${formData.name || 'Portfolio Visitor'}`
    );
    const bodyContent = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );

    window.location.href = `mailto:armabdur.rahman04@gmail.com?subject=${subjectLine}&body=${bodyContent}`;
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.eyebrow}>Direct Communication</span>
        <h1 className={styles.title} data-cursor="inspect" data-cursor-label="CONTACT">
          <ScrambleText text="Get in Touch" />
        </h1>
        <p className={styles.subtitle}>
          Have a software project, an internship opportunity, or want to connect?
          Feel free to send me a message or email me directly.
        </p>
      </header>

      {/* Contact Layout */}
      <div className={styles.contactLayout}>
        {/* Left Column: Direct Info */}
        <div className={styles.infoColumn}>
          {/* Email Card */}
          <SpotlightCard
            className={styles.infoCard}
            contentClassName={styles.infoCardContent}
            tiltIntensity={5}
          >
            <span className={styles.infoLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Direct Email
            </span>
            <span className={styles.infoValue}>armabdur.rahman04@gmail.com</span>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyEmail}
            >
              {copied ? '✓ Copied to clipboard' : 'Copy Email Address'}
            </button>
          </SpotlightCard>

          {/* Location & Time Card */}
          <SpotlightCard
            className={styles.infoCard}
            contentClassName={styles.infoCardContent}
            tiltIntensity={5}
          >
            <span className={styles.infoLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Location &amp; Local Time
            </span>
            <span className={styles.infoValue}>Dhaka, Bangladesh (UTC+6)</span>
            {dhakaTime && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Current time: {dhakaTime}
              </span>
            )}
          </SpotlightCard>

          {/* Availability Status */}
          <SpotlightCard
            className={styles.infoCard}
            contentClassName={styles.infoCardContent}
            tiltIntensity={5}
          >
            <span className={styles.infoLabel}>
              <span className={styles.availDot} />
              Availability Status
            </span>
            <span className={styles.infoValue} style={{ fontSize: '0.95rem' }}>
              Open for Internships &amp; Freelance Projects
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-tertiary)', lineHeight: '1.4' }}>
              Typically respond within 24 hours.
            </span>
          </SpotlightCard>

          {/* Social Profiles */}
          <div className={styles.socialRow}>
            <a
              href="https://github.com/watchknight"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              onClick={() => sound.playTick()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              <span>GitHub</span>
            </a>

            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              onClick={() => sound.playTick()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download CV</span>
            </a>
          </div>
        </div>

        {/* Right Column: Message Form */}
        <SpotlightCard
          as="form"
          className={styles.formCard}
          contentClassName={styles.formCardContent}
          tiltIntensity={4}
          onSubmit={handleSubmit}
        >
          <h2 className={styles.formTitle}>Send a Message</h2>

          {dispatched && (
            <div className={styles.dispatchBanner}>
              <div className={styles.dispatchHeader}>
                <span className={styles.availDot} />
                <span>Dispatched to Default Mail Client</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                If your browser didn&apos;t automatically launch your email app, you can copy the full draft:
              </p>
              <button
                type="button"
                className={styles.dispatchFallbackBtn}
                onClick={handleCopyDraft}
              >
                {draftCopied ? '✓ Full message draft copied to clipboard!' : 'Copy formatted email draft to clipboard &rarr;'}
              </button>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="contact-name" className={styles.formLabel}>Your Name</label>
            <input
              id="contact-name"
              type="text"
              required
              className={styles.formInput}
              placeholder="e.g. Alex Rahman"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contact-email" className={styles.formLabel}>Your Email</label>
            <input
              id="contact-email"
              type="email"
              required
              className={styles.formInput}
              placeholder="e.g. alex@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contact-subject" className={styles.formLabel}>Subject</label>
            <input
              id="contact-subject"
              type="text"
              className={styles.formInput}
              placeholder="e.g. Internship Opportunity / Project Collaboration"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contact-message" className={styles.formLabel}>Message</label>
            <textarea
              id="contact-message"
              required
              className={styles.formTextarea}
              placeholder="Write your message here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <button type="submit" className={styles.sendBtn}>
            <span>Draft &amp; Send Message</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </SpotlightCard>
      </div>
    </div>
  );
}

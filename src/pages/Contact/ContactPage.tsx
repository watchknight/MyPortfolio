import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RollText } from '../../components/RollText/RollText';
import { Magnetic } from '../../components/Magnetic/Magnetic';
import { sound } from '../../audio/sound.js';
import { profileData } from '../../data/profile';
import { copyToClipboard } from '../../utils/clipboard';
import styles from './ContactPage.module.css';

export function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftCopied, setDraftCopied] = useState(false);
  const [draftCopyFailed, setDraftCopyFailed] = useState(false);
  const [dhakaTime, setDhakaTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [touched, setTouched] = useState<{
    name?: boolean;
    email?: boolean;
    message?: boolean;
  }>({});
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Live Dhaka Clock (updates periodically, shows UTC+6)
  useEffect(() => {
    const updateTime = () => {
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date());
      setDhakaTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (submitted && successHeadingRef.current) {
      successHeadingRef.current.focus();
    }
  }, [submitted]);

  const validate = (data: typeof formData) => {
    const errs: { name?: string; email?: string; message?: string } = {};
    if (!data.name.trim()) {
      errs.name = 'Your name is required.';
    } else if (data.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) {
      errs.email = 'An email address is required.';
    } else if (!emailRegex.test(data.email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    if (!data.message.trim()) {
      errs.message = 'A message payload is required.';
    } else if (data.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters long.';
    }
    return errs;
  };

  const handleBlur = (field: 'name' | 'email' | 'message') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const currentErrors = validate(formData);
    setErrors(currentErrors);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    if (touched[field as keyof typeof touched]) {
      const currentErrors = validate(nextData);
      setErrors(currentErrors);
      if (Object.keys(currentErrors).length === 0) {
        setSubmitError(null);
      }
    }
  };

  const handleCopyEmail = async () => {
    await copyToClipboard(profileData.contact.email);
    setCopied(true);
    sound.play('chime');
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copyTimeoutRef.current = null;
    }, 1600);
  };

  const handleCopyDraft = async () => {
    const draft = `To: ${profileData.contact.email}\r\nSubject: ${formData.subject || 'Project Inquiry'}\r\n\r\nName: ${formData.name}\r\nEmail: ${formData.email}\r\n\r\nMessage:\r\n${formData.message}`;
    const ok = await copyToClipboard(draft);
    if (ok) {
      setDraftCopied(true);
      setDraftCopyFailed(false);
      sound.play('chime');
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
      draftTimeoutRef.current = setTimeout(() => {
        setDraftCopied(false);
        draftTimeoutRef.current = null;
      }, 3000);
    } else {
      setDraftCopyFailed(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors = validate(formData);
    setTouched({ name: true, email: true, message: true });
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      setSubmitError('Please review and resolve the highlighted errors below.');
      // Errors never play sound!
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    // Visible processing state before opening default mail client
    await new Promise((resolve) => setTimeout(resolve, 450));

    const subjectLine = encodeURIComponent(
      formData.subject || `Inquiry from ${formData.name || 'Portfolio Visitor'}`
    );
    const bodyContent = encodeURIComponent(
      `Name: ${formData.name}\r\nEmail: ${formData.email}\r\n\r\nMessage:\r\n${formData.message}`
    );

    const mailtoUrl = `mailto:${profileData.contact.email}?subject=${subjectLine}&body=${bodyContent}`;
    try {
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = mailtoUrl;
    }

    setIsSubmitting(false);
    setSubmitted(true);
    sound.play('chime');
  };

  const handleSendAnother = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
    setTouched({});
    setErrors({});
    setSubmitError(null);
    setDraftCopied(false);
    setDraftCopyFailed(false);
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
      draftTimeoutRef.current = null;
    }
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className={`page ${styles.pageContainer}`}>
      <PageHeader
        title="Get in Touch"
        intro="Have a software project, an internship opportunity, or want to connect? Feel free to send me a message or email me directly."
      />

      <section className={`bento ${styles.contactGrid}`} aria-label="Contact options and message form">
        {/* 1. Availability Tile (ACCENT, span-5 rows-3) */}
        <div
          className={`${styles.tile} ${styles.availabilityTile} span-5 rows-3`}
          data-tile="accent"
          aria-label="Availability Status"
        >
          <div className={styles.availabilityHeader}>
            <span className={styles.availabilityDot} aria-hidden="true" />
          </div>
          <h2 className={styles.availabilityTitle}>
            Open for Internships &amp; Freelance Projects
          </h2>
          <p className={styles.availabilityDesc}>
            Typically respond within 24 hours.
          </p>
        </div>

        {/* 2. Direct Email Tile (surface, span-5 rows-2) */}
        <div
          className={`${styles.tile} ${styles.emailTile} span-5 rows-2`}
          data-tile="surface"
          aria-label="Direct Email"
        >
          <a
            href={`mailto:${profileData.contact.email}`}
            className={styles.emailAddress}
            data-cursor="link"
          >
            {profileData.contact.email}
          </a>
          <div>
            <Magnetic strength={0.3}>
              <button
                type="button"
                className={`${styles.copyBtn} ${copied ? 'btn-copied' : ''}`}
                onClick={handleCopyEmail}
                aria-live="polite"
                data-cursor="link"
                data-magnetic="0.3"
              >
                <RollText>{copied ? 'Copied' : 'Copy email'}</RollText>
              </button>
            </Magnetic>
          </div>
        </div>

        {/* 3. Form Tile (surface, span-7 rows-9) */}
        <article
          className={`${styles.tile} ${styles.formTile} span-7 rows-9`}
          data-tile="surface"
          aria-label="Contact form"
        >
          {!submitted ? (
            <>
              <h2 className={styles.formTitle}>Send a message</h2>

              {submitError && (
                <div className={styles.errorBanner} role="alert">
                  <p style={{ margin: 0, fontSize: 'var(--fs-small)', color: 'var(--danger, #FF5A4D)' }}>
                    {submitError}
                  </p>
                </div>
              )}

              <form noValidate onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.nameEmailRow}>
                  <div className={`${styles.field} field`}>
                    <label htmlFor="contact-name">Your Name</label>
                    <input
                      ref={nameInputRef}
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      aria-required="true"
                      aria-invalid={touched.name && Boolean(errors.name)}
                      aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
                      placeholder="e.g. Alex Rahman"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      autoComplete="name"
                      autoCapitalize="words"
                      disabled={isSubmitting}
                      data-cursor="hide"
                    />
                    {touched.name && errors.name && (
                      <span id="name-error" className={`${styles.error} error`} role="alert">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div className={`${styles.field} field`}>
                    <label htmlFor="contact-email">Your Email</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      required
                      aria-required="true"
                      aria-invalid={touched.email && Boolean(errors.email)}
                      aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                      placeholder="e.g. alex@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      autoComplete="email"
                      autoCapitalize="none"
                      disabled={isSubmitting}
                      data-cursor="hide"
                    />
                    {touched.email && errors.email && (
                      <span id="email-error" className={`${styles.error} error`} role="alert">
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`${styles.field} field`}>
                  <label htmlFor="contact-subject">Subject (Optional)</label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    placeholder="e.g. Internship Opportunity / Project Collaboration"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    autoCapitalize="sentences"
                    disabled={isSubmitting}
                    data-cursor="hide"
                  />
                </div>

                <div className={`${styles.field} field`}>
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    aria-required="true"
                    aria-invalid={touched.message && Boolean(errors.message)}
                    aria-describedby={touched.message && errors.message ? 'message-error' : undefined}
                    placeholder="Write your message here (min 10 characters)..."
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    onBlur={() => handleBlur('message')}
                    autoCapitalize="sentences"
                    disabled={isSubmitting}
                    data-cursor="hide"
                  />
                  {touched.message && errors.message && (
                    <span id="message-error" className={`${styles.error} error`} role="alert">
                      {errors.message}
                    </span>
                  )}
                </div>

                <div className={styles.submitSection}>
                  <Magnetic strength={0.3}>
                    <button
                      type="submit"
                      className={`${styles.submitBtn} ${isSubmitting ? styles.submitBtnLoading : ''}`}
                      disabled={isSubmitting}
                      data-cursor="link"
                      data-magnetic="0.3"
                    >
                      {isSubmitting ? (
                        <>
                          <span className={styles.btnSpinner} aria-hidden="true" />
                          <span>Drafting message...</span>
                        </>
                      ) : (
                        <>
                          <RollText>Draft &amp; Send Message</RollText>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </>
                      )}
                    </button>
                  </Magnetic>
                  <p className={styles.mailtoNote}>
                    Opens your email app with the message filled in.
                  </p>
                </div>
              </form>
            </>
          ) : (
            <div className={styles.successTile} role="status" aria-live="polite">
              <div className={styles.successIconBadge} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 ref={successHeadingRef} tabIndex={-1} className={styles.successTitle} style={{ outline: 'none' }}>
                Draft prepared &amp; ready to send
              </h2>
              <p className={styles.successText}>
                Your default email application has been opened with your pre-filled inquiry.
                If it didn&apos;t launch automatically, you can copy the full formatted draft below.
              </p>

              <div className={styles.successActions}>
                <Magnetic strength={0.3}>
                  <button
                    type="button"
                    className={styles.sendAnotherBtn}
                    onClick={handleSendAnother}
                    data-cursor="link"
                    data-magnetic="0.3"
                  >
                    <RollText>Send another message</RollText>
                  </button>
                </Magnetic>

                <Magnetic strength={0.3}>
                  <button
                    type="button"
                    className={`${styles.copyDraftBtn} ${draftCopied ? 'btn-copied' : ''}`}
                    onClick={handleCopyDraft}
                    aria-live="polite"
                    data-cursor="link"
                    data-magnetic="0.3"
                  >
                    <RollText>{draftCopied ? 'Draft copied!' : 'Copy formatted email draft'}</RollText>
                  </button>
                </Magnetic>
              </div>

              {draftCopyFailed && (
                <div className={styles.draftFallbackContainer}>
                  <p className={styles.draftFallbackNotice}>
                    Clipboard access was not permitted. You can select and copy your pre-formatted draft directly:
                  </p>
                  <textarea
                    readOnly
                    className={styles.draftFallbackArea}
                    value={`To: ${profileData.contact.email}\r\nSubject: ${formData.subject || 'Project Inquiry'}\r\n\r\nName: ${formData.name}\r\nEmail: ${formData.email}\r\n\r\nMessage:\r\n${formData.message}`}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    aria-label="Formatted email draft text"
                  />
                </div>
              )}
            </div>
          )}
        </article>

        {/* 4. Local Time Tile (surface, span-5 rows-2) */}
        <div
          className={`${styles.tile} ${styles.timeTile} span-5 rows-2`}
          data-tile="surface"
          aria-label="Local Time"
        >
          <div className={styles.timeHeader}>
            <span className={styles.timeLocation}>Dhaka, Bangladesh (UTC+6)</span>
          </div>
          <div className={styles.dhakaTimeDisplay}>
            <span className={styles.dhakaTimeDigits}>{dhakaTime || '14:32'}</span>
            <span className={styles.dhakaTimeSub}>Local Time</span>
          </div>
        </div>

        {/* 5. Links Tile (INVERTED, span-5 rows-2) */}
        <div
          className={`${styles.tile} ${styles.linksTile} span-5 rows-2`}
          data-tile="inverted"
          aria-label="Direct Profiles & Links"
        >
          <div className={styles.linksRow}>
            {profileData.contact.githubUrl && (
              <Magnetic strength={0.3}>
                <a
                  href={profileData.contact.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.invertedLink}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  <RollText>GitHub</RollText>
                </a>
              </Magnetic>
            )}

            {profileData.contact.resumeUrl && (
              <Magnetic strength={0.3}>
                <a
                  href={profileData.contact.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.invertedLink}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <RollText>Download CV</RollText>
                </a>
              </Magnetic>
            )}

            {profileData.contact.linkedinUrl && (
              <Magnetic strength={0.3}>
                <a
                  href={profileData.contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.invertedLink}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  <RollText>LinkedIn</RollText>
                </a>
              </Magnetic>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

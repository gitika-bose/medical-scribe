import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import './ExplainAppRec.css'
import Footer from '../components/shared/Footer'
import {
  tryUploadNotesAppointmentLegacy as tryUploadNotesAppointment,
  tryUploadRecordingLegacy as tryUploadRecording,
  tryGenerateQuestionsLegacy as tryGenerateQuestions,
} from '../api/appointments'
import type { SoapNotesV12 as SoapNotes } from '../api/appointments'
import { analyticsEvents } from '../api/analytics'

const MAX_CHARS = 2000;
const ACCEPTED_AUDIO_TYPES = '.webm,.m4a';

function ExplainAppRecPage() {
  useEffect(() => {
    analyticsEvents.tryPageOpen();
  }, []);

  const [notesText, setNotesText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [helpfulness, setHelpfulness] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [soapNotes, setSoapNotes] = useState<SoapNotes | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [learningsExpanded, setLearningsExpanded] = useState(false);

  const charCount = notesText.length;
  const canSubmit = (notesText.trim().length > 0 || uploadedFile !== null) && !isLoading;
  const hasResults = soapNotes !== null || questions !== null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setNotesText(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      analyticsEvents.tryUploadFile(file.size, file.type);
    }
    setUploadedFile(file);
  };

  const handleRemoveFile = () => {
    analyticsEvents.tryRemoveFile();
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSoapNotes(null);
    setTitle(null);
    setQuestions(null);
    setLearningsExpanded(false);

    try {
      const hasRecording = uploadedFile !== null;
      const hasNotes = notesText.trim().length > 0;

      if (!hasRecording && !hasNotes) return;

      analyticsEvents.trySubmit(hasRecording, hasNotes);

      // Set loading text
      if (hasRecording) {
        setLoadingText('Juno is processing to your recording…');
      } else {
        setLoadingText('Juno is processing your notes…');
      }

      let processedSoapNotes: SoapNotes;
      let processedTitle: string;
      let questionsResult: { questions: string[] };

      if (hasRecording) {
        // For recordings, we need the transcript before generating questions
        const recordingResult = await tryUploadRecording(uploadedFile!);
        processedSoapNotes = recordingResult.soapNotes;
        processedTitle = recordingResult.title;

        // Now generate questions using the transcript from the recording
        const transcript = hasNotes ? notesText.trim() : recordingResult.transcript;
        questionsResult = await tryGenerateQuestions(transcript).catch(() => ({
          questions: [] as string[],
        }));
      } else {
        // For notes, fire both API calls in parallel since we already have the text
        const [notesResult, qResult] = await Promise.all([
          tryUploadNotesAppointment(notesText.trim()),
          tryGenerateQuestions(notesText.trim()).catch(() => ({
            questions: [] as string[],
          })),
        ]);
        processedSoapNotes = notesResult.soapNotes;
        processedTitle = notesResult.title;
        questionsResult = qResult;
      }

      setSoapNotes(processedSoapNotes);
      setTitle(processedTitle);
      setQuestions(
        questionsResult.questions.length > 0 ? questionsResult.questions : null,
      );
      analyticsEvents.trySubmitSuccess(hasRecording, hasNotes);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      analyticsEvents.trySubmitError(message);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (helpfulness === 0) return;
    setFeedbackSubmitting(true);
    try {
      // Build a plain-text message with all form fields
      const messageLines = [
        `Source: try-page-feedback`,
        `Helpfulness: ${helpfulness}/5 stars`,
        `Feedback: ${feedbackText || '(none)'}`,
        `User Email: ${feedbackEmail.trim() || '(not provided)'}`,
      ];

      // Include input length metadata (not the content itself)
      if (uploadedFile) {
        messageLines.push(`Recording Size: ${uploadedFile.size} bytes`);
      }
      if (notesText.trim().length > 0) {
        messageLines.push(`Notes Length: ${notesText.length} characters`);
      }
      const message = messageLines.join('\n');

      // Send email via Formspree
      await fetch('https://formspree.io/f/mjgeorjw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: 'gitika.bose@gmail.com',
          message,
        }),
      });
      analyticsEvents.tryFeedbackSubmit(helpfulness);
      setFeedbackSent(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const charCountClass =
    charCount >= MAX_CHARS
      ? 'try-char-count at-limit'
      : charCount >= MAX_CHARS * 0.9
        ? 'try-char-count near-limit'
        : 'try-char-count';

  // ---------------------------------------------------------------------------
  // Helpers for rendering todo icons
  // ---------------------------------------------------------------------------
  function getTodoMeta(type: string): { icon: string; color: string } {
    const t = type.toLowerCase();
    if (t === 'medication') return { icon: '💊', color: '#3B82F6' };
    if (t === 'tests' || t === 'test') return { icon: '🧪', color: '#22C55E' };
    if (t === 'procedure') return { icon: '🩺', color: '#A855F7' };
    return { icon: '📋', color: '#F97316' };
  }

  // ---------------------------------------------------------------------------
  // Render output content
  // ---------------------------------------------------------------------------
  const renderOutput = () => {
    if (isLoading) {
      return (
        <div className="try-loading">
          <div className="try-loading-spinner" />
          <p className="try-loading-text">{loadingText}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="try-error">
          <div className="try-error-icon">⚠️</div>
          <p className="try-error-text">{error}</p>
        </div>
      );
    }

    if (!hasResults) {
      return (
        <div className="try-output-placeholder">
          <div className="try-output-placeholder-icon">📋</div>
          <div className="try-output-placeholder-text">
            Your visit explanation will appear here
          </div>
        </div>
      );
    }

    return (
      <div className="try-results">
        {/* Title */}
        {title && <h2 className="try-results-title">{title}</h2>}

        {/* Questions */}
        {questions && questions.length > 0 && (
          <div className="result-card result-questions-card">
            <h3 className="result-heading">Recommended questions to ask your doctor</h3>
            <ul className="result-questions-list">
              {questions.map((q, i) => (
                <li key={i} className="result-question-item">{q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        {soapNotes?.summary && (
          <div className="result-card">
            <h3 className="result-heading">Summary</h3>
            <p className="result-body">{soapNotes.summary}</p>
          </div>
        )}

        {/* Diagnosis */}
        {soapNotes?.diagnosis?.details && soapNotes.diagnosis.details.length > 0 && (
          <div className="result-card">
            <h3 className="result-heading">Diagnosis</h3>
            <div className="result-items-list">
              {[...soapNotes.diagnosis.details]
                .sort((a, b) => {
                  const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                  return (order[a.severity ?? ''] ?? 3) - (order[b.severity ?? ''] ?? 3);
                })
                .map((d, i) => (
                  <div key={i} className="result-diagnosis-item">
                    <div className="result-diagnosis-accent" />
                    <div className="result-diagnosis-content">
                      <div className="result-item-title">{d.title}</div>
                      <div className="result-item-description">{d.description}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action Items (Todos) */}
        {soapNotes?.todos && soapNotes.todos.length > 0 && (
          <div className="result-card">
            <h3 className="result-heading">Action Items</h3>
            <div className="result-items-list">
              {soapNotes.todos.map((todo, i) => {
                const meta = getTodoMeta(todo.type);
                const isMed = todo.type.toLowerCase() === 'medication';
                const isProc = todo.type.toLowerCase() === 'procedure';
                return (
                  <div
                    key={i}
                    className="result-todo-item"
                    style={{ borderLeftColor: meta.color }}
                  >
                    <div className="result-todo-header">
                      <span className="result-todo-icon">{meta.icon}</span>
                      <div className="result-todo-header-content">
                        <div className="result-todo-title-row">
                          <span className="result-item-title">{todo.title}</span>
                          {todo.verified && (
                            <span className="result-verified-badge">Verified</span>
                          )}
                        </div>
                        {todo.description && (
                          <div className="result-item-description">{todo.description}</div>
                        )}
                      </div>
                    </div>
                    {isMed &&
                      (todo.dosage || todo.frequency || todo.timing || todo.duration) && (
                        <div className="result-todo-details">
                          {todo.dosage && <span>💊 {todo.dosage}</span>}
                          {todo.frequency && <span>⏱️ {todo.frequency}</span>}
                          {todo.timing && <span>🕐 {todo.timing}</span>}
                          {todo.duration && <span>📅 {todo.duration}</span>}
                        </div>
                      )}
                    {isProc && todo.timeframe && (
                      <div className="result-todo-details">
                        <span>📅 {todo.timeframe}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Follow-up */}
        {soapNotes?.follow_up && soapNotes.follow_up.length > 0 && (
          <div className="result-card">
            <h3 className="result-heading">Follow-up</h3>
            <div className="result-items-list">
              {soapNotes.follow_up.map((item, i) => (
                <div key={i} className="result-followup-item">
                  <div className="result-item-description">{item.description}</div>
                  <div className="result-followup-timeframe">📅 {item.time_frame}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Learnings (collapsible) */}
        {soapNotes?.learnings && soapNotes.learnings.length > 0 && (
          <div className="result-card">
            <button
              className="result-heading-toggle"
              onClick={() => {
                const newExpanded = !learningsExpanded;
                analyticsEvents.tryToggleLearnings(newExpanded);
                setLearningsExpanded(newExpanded);
              }}
            >
              <h3 className="result-heading" style={{ marginBottom: 0 }}>Key Learnings</h3>
              <span className={`result-toggle-arrow ${learningsExpanded ? 'expanded' : ''}`}>
                ▸
              </span>
            </button>
            {learningsExpanded && (
              <div className="result-items-list" style={{ marginTop: '0.75rem' }}>
                {soapNotes.learnings.map((l, i) => (
                  <div key={i} className="result-learning-item">
                    <span className="result-learning-icon">💡</span>
                    <div className="result-learning-content">
                      <div className="result-item-title">{l.title}</div>
                      <div className="result-item-description">{l.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="try-page">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <img src="/logo/android-chrome-192x192.png" alt="Juno Logo" className="logo" />
          <span className="logo-text">Juno</span>
        </Link>
        <div className="header-actions">
          <Link to="/" className="nav-link" onClick={() => analyticsEvents.tryClickBackHome()}>← Back to Home</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="try-hero">
        <h1>Understand a doctor visit instantly</h1>
        <p className="try-hero-subtitle">
          Paste notes or upload a recording from a medical appointment.<br />
          Juno will explain what matters in clear, simple language.
        </p>
      </section>

      {/* Main two-column content */}
      <div className="try-content">
        {/* Left: Input section */}
        <div className="try-input-section">
          {/* File upload */}
          <div className={`try-file-upload${uploadedFile ? ' has-file' : ''}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_AUDIO_TYPES}
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <div className="try-file-upload-icon">🎙️</div>
            <div className="try-file-upload-text">
              {uploadedFile ? 'File selected' : 'Upload a recording'}
            </div>
            <div className="try-file-upload-hint">
              WebM or M4A — up to 25 MB
            </div>
            {uploadedFile && (
              <div className="try-file-name">
                📎 {uploadedFile.name}
                <button
                  className="try-file-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="try-divider">
            <span>or paste notes</span>
          </div>

          {/* Text input */}
          <div className="try-text-input-wrapper">
            <textarea
              className="try-text-input"
              placeholder="Doctor said blood pressure is borderline high, start 5mg amlodipine daily, follow up in 6 weeks, reduce salt…"
              value={notesText}
              onChange={handleTextChange}
              maxLength={MAX_CHARS}
              disabled={isLoading}
            />
            <div className={charCountClass}>
              {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </div>
          </div>

          {/* Submit */}
          <div className="try-submit-wrapper">
            <button
              className="try-submit-button"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {isLoading ? 'Processing…' : 'Explain this visit'}
            </button>
            <p className="try-submit-disclaimer">
              No account needed · Files deleted after processing
            </p>
          </div>
        </div>

        {/* Right: Output */}
        <div className={`try-output-section${hasResults ? ' has-results' : ''}`}>
          {renderOutput()}
        </div>
      </div>

      {/* Feedback section */}
      <section className="try-feedback">
        <div className="try-feedback-inner">
          <div className="try-feedback-question">
            <label>Was this helpful?</label>
            <div className="try-star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`try-star${star <= (hoverRating || helpfulness) ? ' filled' : ''}`}
                  onClick={() => setHelpfulness(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
              {helpfulness > 0 && (
                <span className="try-star-label">{helpfulness}/5</span>
              )}
            </div>
          </div>

          <div className="try-feedback-question">
            <label>
              What was confusing or missing?{' '}
              <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>
                (optional)
              </span>
            </label>
            <textarea
              className="try-feedback-textarea"
              placeholder="Tell us how we can improve…"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>

          <div className="try-feedback-question">
            <label>
              Enter email{' '}
              <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>
                (optional)
              </span>
            </label>
            <input
              type="email"
              className="try-feedback-textarea"
              style={{ minHeight: 'unset', height: 'auto', padding: '0.625rem 0.75rem' }}
              placeholder="you@example.com"
              value={feedbackEmail}
              onChange={(e) => setFeedbackEmail(e.target.value)}
            />
          </div>

          <div className="try-feedback-submit">
            <button
              className="try-feedback-submit-button"
              disabled={helpfulness === 0 || feedbackSubmitting || feedbackSent}
              onClick={handleFeedbackSubmit}
            >
              {feedbackSent ? 'Thanks for your feedback!' : feedbackSubmitting ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default ExplainAppRecPage

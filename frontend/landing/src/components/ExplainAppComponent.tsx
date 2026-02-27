import { useState, useRef, useEffect, type ReactNode, forwardRef } from 'react'
import '../pages/ExplainApp.css'
import {
  tryCreateAppointment,
  tryUploadRecording,
  tryUploadDocument,
  tryUploadNotes,
  tryProcessAppointment,
  tryGenerateQuestions,
} from '../api/appointments'
import type { SoapNotesV13 } from '../api/appointments'
import { analyticsEvents } from '../api/analytics'

const MAX_CHARS = 10000;
const MAX_FILES = 5;
const ACCEPTED_AUDIO_TYPES = '.webm,.m4a';
const ACCEPTED_DOC_TYPES = '.pdf';

// =============================================================================
// Reusable helper components
// =============================================================================

function ReadMore({ items, initialCount = 3 }: { items: ReactNode[]; initialCount?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!items || items.length === 0) return null;
  const showAll = expanded || items.length <= initialCount;
  const displayItems = showAll ? items : items.slice(0, initialCount);
  return (
    <div>
      <div className="read-more-list">{displayItems}</div>
      {items.length > initialCount && (
        <div className="read-more-toggle-row">
          <button className="read-more-toggle-button" onClick={() => setExpanded(!expanded)}>
            <span className={`read-more-chevron ${expanded ? 'expanded' : ''}`}>▾</span>
            <span>{expanded ? 'Show Less' : `Read More (${items.length - initialCount} more)`}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function CollapsibleCard({
  title,
  icon,
  children,
  defaultCollapsed = false,
}: {
  title: string;
  icon: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className="result-card">
      <button className="result-card-toggle" onClick={() => setCollapsed(!collapsed)}>
        <div className="result-section-header">
          <span className="result-section-icon">{icon}</span>
          <h3 className="result-heading">{title}</h3>
        </div>
        <span className={`result-toggle-arrow ${collapsed ? '' : 'expanded'}`}>▸</span>
      </button>
      {!collapsed && <div className="result-card-body">{children}</div>}
    </div>
  );
}

function ImportanceSplitList<T extends { importance: 'high' | 'low' }>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const highItems = items.filter((it) => it.importance === 'high');
  const lowItems = items.filter((it) => it.importance === 'low');

  return (
    <div className="result-items-list">
      {highItems.map((item, i) => renderItem(item, i))}
      {lowItems.length > 0 && (
        <ReadMore
          items={lowItems.map((item, i) => renderItem(item, highItems.length + i))}
          initialCount={highItems.length > 0 ? 0 : 2}
        />
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

const ExplainAppComponent = forwardRef<HTMLDivElement>((_props, ref) => {
  useEffect(() => {
    analyticsEvents.tryPageOpen();
  }, []);

  // Input state
  const [notesText, setNotesText] = useState('');
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const recordingInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [soapNotes, setSoapNotes] = useState<SoapNotesV13 | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Feedback state
  const [helpfulness, setHelpfulness] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Derived
  const charCount = notesText.length;
  const hasRecording = recordingFile !== null;
  const hasDocuments = documentFiles.length > 0;
  const hasNotes = notesText.trim().length > 0;
  const canSubmit = (hasRecording || hasDocuments || hasNotes) && !isLoading;
  const hasResults = soapNotes !== null || questions !== null;

  // Handlers – Recording
  const handleRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) analyticsEvents.tryUploadFile(file.size, file.type);
    setRecordingFile(file);
  };

  const handleRemoveRecording = () => {
    analyticsEvents.tryRemoveFile();
    setRecordingFile(null);
    if (recordingInputRef.current) recordingInputRef.current.value = '';
  };

  // Handlers – Documents
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    const remaining = MAX_FILES - documentFiles.length;
    const toAdd = newFiles.slice(0, remaining);
    if (toAdd.length > 0) {
      toAdd.forEach((f) => analyticsEvents.tryUploadFile(f.size, f.type));
      setDocumentFiles((prev) => [...prev, ...toAdd]);
    }
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const handleRemoveDocument = (index: number) => {
    analyticsEvents.tryRemoveFile();
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handlers – Notes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) setNotesText(value);
  };

  // Submit
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSoapNotes(null);
    setTitle(null);
    setQuestions(null);

    try {
      analyticsEvents.trySubmit(hasRecording, hasNotes);
      setLoadingStep('Creating appointment…');
      const appointmentId = await tryCreateAppointment();

      if (hasRecording) {
        setLoadingStep('Uploading recording…');
        await tryUploadRecording(appointmentId, recordingFile!);
      }

      for (let i = 0; i < documentFiles.length; i++) {
        setLoadingStep(
          documentFiles.length === 1
            ? 'Uploading file…'
            : `Uploading file ${i + 1} of ${documentFiles.length}…`,
        );
        await tryUploadDocument(appointmentId, documentFiles[i]);
      }

      if (hasNotes) {
        setLoadingStep('Saving notes…');
        await tryUploadNotes(appointmentId, notesText.trim());
      }

      setLoadingStep('Juno is analyzing your visit…');
      const processResult = await tryProcessAppointment(appointmentId);
      const processedSoapNotes = processResult.soapNotes;
      const processedTitle = processResult.title ?? processResult.soapNotes?.title ?? null;

      setLoadingStep('Generating questions…');
      const questionsResult = await tryGenerateQuestions(appointmentId);

      setSoapNotes(processedSoapNotes);
      setTitle(processedTitle);
      setQuestions(questionsResult.questions.length > 0 ? questionsResult.questions : null);
      analyticsEvents.trySubmitSuccess(hasRecording, hasNotes);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      analyticsEvents.trySubmitError(message);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Feedback submit
  const handleFeedbackSubmit = async () => {
    if (helpfulness === 0) return;
    setFeedbackSubmitting(true);
    try {
      const messageLines = [
        `Source: try-page-feedback`,
        `Helpfulness: ${helpfulness}/5 stars`,
        `Feedback: ${feedbackText || '(none)'}`,
        `User Email: ${feedbackEmail.trim() || '(not provided)'}`,
      ];
      if (recordingFile) messageLines.push(`Recording Size: ${recordingFile.size} bytes`);
      if (documentFiles.length > 0) messageLines.push(`Documents: ${documentFiles.length} file(s)`);
      if (notesText.trim().length > 0) messageLines.push(`Notes Length: ${notesText.length} characters`);
      const message = messageLines.join('\n');

      await fetch('https://formspree.io/f/mjgeorjw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: 'gitika.bose@gmail.com', message }),
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

  // Render output content
  const renderOutput = () => {
    if (isLoading) {
      return (
        <div className="try-loading">
          <div className="try-loading-spinner" />
          <p className="try-loading-text">{loadingStep}</p>
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
          <div className="try-output-placeholder-text">Your visit explanation will appear here</div>
        </div>
      );
    }

    const sortByImportance = <T extends { importance: 'high' | 'low' }>(items: T[]): T[] =>
      [...items].sort((a, b) => {
        if (a.importance === b.importance) return 0;
        return a.importance === 'high' ? -1 : 1;
      });

    const allLowImportance = (items: { importance: 'high' | 'low' }[]) =>
      items.every((item) => item.importance === 'low');

    return (
      <div className="try-results">
        {title && <h2 className="try-results-title">{title}</h2>}

        {soapNotes?.summary && (
          <div className="result-card">
            <div className="result-section-header">
              <span className="result-section-icon">📋</span>
              <h3 className="result-heading">Summary</h3>
            </div>
            <p className="result-body">{soapNotes.summary}</p>
          </div>
        )}

        {soapNotes?.diagnosis?.details && soapNotes.diagnosis.details.length > 0 && (
          <div className="result-card">
            <div className="result-section-header">
              <span className="result-section-icon">🔍</span>
              <h3 className="result-heading">Diagnosis</h3>
            </div>
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

        {soapNotes?.action_todo && soapNotes.action_todo.length > 0 && (
          <div className="result-card">
            <div className="result-section-header">
              <span className="result-section-icon">✅</span>
              <h3 className="result-heading">Action Items</h3>
            </div>
            <div className="result-items-list">
              {sortByImportance(soapNotes.action_todo).map((todo, i) => (
                <div key={i} className="result-action-todo-item">
                  <span className="result-action-todo-bullet">•</span>
                  <span className="result-item-title">{todo.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {soapNotes?.reason_for_visit && soapNotes.reason_for_visit.length > 0 && (
          <CollapsibleCard title="Reason for Visit" icon="🏥" defaultCollapsed={true}>
            <div className="result-items-list">
              {soapNotes.reason_for_visit.map((item, i) => (
                <div key={i} className="result-reason-item">
                  <div className="result-reason-accent" />
                  <div className="result-reason-content">
                    <div className="result-item-title">{item.reason}</div>
                    {item.description && <div className="result-item-description">{item.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleCard>
        )}

        {soapNotes?.tests && soapNotes.tests.length > 0 && (
          <CollapsibleCard title="Tests" icon="🧪" defaultCollapsed={allLowImportance(soapNotes.tests)}>
            <ImportanceSplitList
              items={sortByImportance(soapNotes.tests)}
              renderItem={(test, i) => (
                <div key={i} className="result-todo-item" style={{ borderLeftColor: '#22C55E' }}>
                  <div className="result-todo-header-content">
                    <div className="result-item-title">{test.title}</div>
                    {test.description && <div className="result-item-description">{test.description}</div>}
                  </div>
                </div>
              )}
            />
          </CollapsibleCard>
        )}

        {soapNotes?.medications && soapNotes.medications.length > 0 && (
          <CollapsibleCard title="Medications" icon="💊" defaultCollapsed={allLowImportance(soapNotes.medications)}>
            <ImportanceSplitList
              items={sortByImportance(soapNotes.medications)}
              renderItem={(med, i) => (
                <div key={i} className="result-todo-item" style={{ borderLeftColor: '#3B82F6' }}>
                  <div className="result-todo-header-content">
                    <div className="result-todo-title-row">
                      <span className="result-item-title">{med.title}</span>
                      {med.change && <span className="result-change-badge">Changed</span>}
                    </div>
                    {med.instructions && <div className="result-item-description">{med.instructions}</div>}
                    {(med.dosage || med.frequency || med.timing || med.duration) && (
                      <div className="result-todo-details">
                        {med.dosage && <span>💊 {med.dosage}</span>}
                        {med.frequency && <span>⏱️ {med.frequency}</span>}
                        {med.timing && <span>🕐 {med.timing}</span>}
                        {med.duration && <span>📅 {med.duration}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            />
          </CollapsibleCard>
        )}

        {soapNotes?.procedures && soapNotes.procedures.length > 0 && (
          <CollapsibleCard title="Procedures" icon="🩺" defaultCollapsed={allLowImportance(soapNotes.procedures)}>
            <ImportanceSplitList
              items={sortByImportance(soapNotes.procedures)}
              renderItem={(proc, i) => (
                <div key={i} className="result-todo-item" style={{ borderLeftColor: '#A855F7' }}>
                  <div className="result-todo-header-content">
                    <div className="result-item-title">{proc.title}</div>
                    {proc.description && <div className="result-item-description">{proc.description}</div>}
                    {proc.timeframe && (
                      <div className="result-todo-details">
                        <span>📅 {proc.timeframe}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            />
          </CollapsibleCard>
        )}

        {soapNotes?.other && soapNotes.other.length > 0 && (
          <CollapsibleCard title="Other Instructions" icon="📋" defaultCollapsed={allLowImportance(soapNotes.other)}>
            <ImportanceSplitList
              items={sortByImportance(soapNotes.other)}
              renderItem={(item, i) => (
                <div key={i} className="result-todo-item" style={{ borderLeftColor: '#F97316' }}>
                  <div className="result-todo-header-content">
                    <div className="result-item-title">{item.title}</div>
                    {item.description && <div className="result-item-description">{item.description}</div>}
                    {(item.dosage || item.frequency || item.timing || item.duration) && (
                      <div className="result-todo-details">
                        {item.dosage && <span>💊 {item.dosage}</span>}
                        {item.frequency && <span>⏱️ {item.frequency}</span>}
                        {item.timing && <span>🕐 {item.timing}</span>}
                        {item.duration && <span>📅 {item.duration}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            />
          </CollapsibleCard>
        )}

        {soapNotes?.follow_up && soapNotes.follow_up.length > 0 && (
          <div className="result-card">
            <div className="result-section-header">
              <span className="result-section-icon">📅</span>
              <h3 className="result-heading">Follow-up</h3>
            </div>
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

        {soapNotes?.why_recommended && (
          <CollapsibleCard title="Why is this the plan?" icon="💡" defaultCollapsed={false}>
            <p className="result-body">{soapNotes.why_recommended}</p>
          </CollapsibleCard>
        )}

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
      </div>
    );
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <div ref={ref}>
      {/* Main two-column content */}
      <div className="try-content">
        {/* Left: Input section */}
        <div className="try-input-section">
          {/* Recording upload */}
          <div className="try-input-group">
            <label className="try-input-label">🎙️ Recording</label>
            <div className={`try-file-upload${recordingFile ? ' has-file' : ''}`}>
              <input
                ref={recordingInputRef}
                type="file"
                accept={ACCEPTED_AUDIO_TYPES}
                onChange={handleRecordingChange}
                disabled={isLoading}
              />
              <div className="try-file-upload-icon">🎙️</div>
              <div className="try-file-upload-text">
                {recordingFile ? 'File selected' : 'Upload a recording'}
              </div>
              <div className="try-file-upload-hint">WebM or M4A — up to 25 MB</div>
              {recordingFile && (
                <div className="try-file-name">
                  📎 {recordingFile.name}
                  <button
                    className="try-file-remove"
                    onClick={(e) => { e.stopPropagation(); handleRemoveRecording(); }}
                    aria-label="Remove file"
                  >✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Document upload */}
          <div className="try-input-group">
            <label className="try-input-label">
              📄 Files{' '}
              <span className="try-input-label-hint">({documentFiles.length}/{MAX_FILES})</span>
            </label>
            {documentFiles.length > 0 && (
              <div className="try-doc-list">
                {documentFiles.map((file, idx) => (
                  <div key={idx} className="try-doc-item">
                    <span className="try-doc-item-name">📎 {file.name}</span>
                    <button
                      className="try-file-remove"
                      onClick={() => handleRemoveDocument(idx)}
                      aria-label={`Remove ${file.name}`}
                      disabled={isLoading}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            {documentFiles.length < MAX_FILES && (
              <div className="try-doc-upload-area">
                <input
                  ref={documentInputRef}
                  type="file"
                  accept={ACCEPTED_DOC_TYPES}
                  onChange={handleDocumentChange}
                  disabled={isLoading}
                  multiple
                />
                <div className="try-doc-upload-content">
                  <span className="try-doc-upload-icon">+</span>
                  <span className="try-doc-upload-text">
                    {documentFiles.length === 0 ? 'Upload PDF files' : 'Add more files'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes textarea */}
          <div className="try-input-group">
            <label className="try-input-label">📝 Notes</label>
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
          </div>

          {/* Submit */}
          <div className="try-submit-wrapper">
            <button className="try-submit-button" disabled={!canSubmit} onClick={handleSubmit}>
              {isLoading ? 'Processing…' : 'Explain this visit'}
            </button>
            <p className="try-submit-disclaimer">No account needed · Files deleted after processing</p>
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
                >★</button>
              ))}
              {helpfulness > 0 && <span className="try-star-label">{helpfulness}/5</span>}
            </div>
          </div>

          <div className="try-feedback-question">
            <label>
              What was confusing or missing?{' '}
              <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
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
              <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
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
    </div>
  );
});

ExplainAppComponent.displayName = 'ExplainAppComponent';

export default ExplainAppComponent;

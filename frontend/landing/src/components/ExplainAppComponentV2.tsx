import { useState, useRef, useEffect, type ReactNode, forwardRef, type FormEvent } from 'react'
import './ExplainAppV2.css'
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

/* ── Helper: ReadMore ── */
function V2ReadMore({ items, initialCount = 3 }: { items: ReactNode[]; initialCount?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!items || items.length === 0) return null;
  const showAll = expanded || items.length <= initialCount;
  const display = showAll ? items : items.slice(0, initialCount);
  return (
    <div>
      <div className="v2-read-more-list">{display}</div>
      {items.length > initialCount && (
        <div className="v2-read-more-row">
          <button className="v2-read-more-btn" onClick={() => setExpanded(!expanded)}>
            <span className={`v2-chevron ${expanded ? 'expanded' : ''}`}>▾</span>
            <span>{expanded ? 'Show Less' : `Read More (${items.length - initialCount} more)`}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Helper: CollapsibleCard ── */
function V2CollapsibleCard({ title, icon, children, defaultCollapsed = false }: {
  title: string; icon: string; children: ReactNode; defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className="v2-result-card">
      <button className="v2-card-toggle" onClick={() => setCollapsed(!collapsed)}>
        <div className="v2-result-section-header">
          <span className="v2-result-section-icon">{icon}</span>
          <h3 className="v2-result-heading">{title}</h3>
        </div>
        <span className={`v2-toggle-arrow ${collapsed ? '' : 'expanded'}`}>▸</span>
      </button>
      {!collapsed && <div className="v2-card-body">{children}</div>}
    </div>
  );
}

/* ── Helper: ImportanceSplitList ── */
function V2ImportanceSplitList<T extends { importance: 'high' | 'low' }>({ items, renderItem }: {
  items: T[]; renderItem: (item: T, index: number) => ReactNode;
}) {
  const high = items.filter(i => i.importance === 'high');
  const low = items.filter(i => i.importance === 'low');
  return (
    <div className="v2-result-items-list">
      {high.map((item, i) => renderItem(item, i))}
      {low.length > 0 && (
        <V2ReadMore items={low.map((item, i) => renderItem(item, high.length + i))} initialCount={high.length > 0 ? 0 : 2} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
const ExplainAppComponentV2 = forwardRef<HTMLDivElement>((_props, ref) => {
  useEffect(() => { analyticsEvents.tryPageOpen(); }, []);

  // --- Input state ---
  const [notesText, setNotesText] = useState('');
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const recordingInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // --- Result state ---
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [soapNotes, setSoapNotes] = useState<SoapNotesV13 | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Modal state ---
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // --- Feedback state ---
  const [helpfulness, setHelpfulness] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // --- Waitlist state ---
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // --- Ref for PDF capture ---
  const summaryRef = useRef<HTMLDivElement>(null);

  // Derived
  const charCount = notesText.length;
  const hasRecording = recordingFile !== null;
  const hasDocuments = documentFiles.length > 0;
  const hasNotes = notesText.trim().length > 0;
  const canSubmit = (hasRecording || hasDocuments || hasNotes) && !isLoading;
  const hasResults = soapNotes !== null || questions !== null;

  // --- Handlers ---
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
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const toAdd = Array.from(files).slice(0, MAX_FILES - documentFiles.length);
    if (toAdd.length > 0) {
      toAdd.forEach(f => analyticsEvents.tryUploadFile(f.size, f.type));
      setDocumentFiles(prev => [...prev, ...toAdd]);
    }
    if (documentInputRef.current) documentInputRef.current.value = '';
  };
  const handleRemoveDocument = (index: number) => {
    analyticsEvents.tryRemoveFile();
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) setNotesText(e.target.value);
  };

  // Submit
  const handleSubmit = async () => {
    setIsLoading(true); setError(null); setSoapNotes(null); setTitle(null); setQuestions(null);
    try {
      analyticsEvents.trySubmit(hasRecording, hasNotes);
      setLoadingStep('Creating appointment…');
      const appointmentId = await tryCreateAppointment();
      if (hasRecording) { setLoadingStep('Uploading recording…'); await tryUploadRecording(appointmentId, recordingFile!); }
      for (let i = 0; i < documentFiles.length; i++) {
        setLoadingStep(documentFiles.length === 1 ? 'Uploading file…' : `Uploading file ${i + 1} of ${documentFiles.length}…`);
        await tryUploadDocument(appointmentId, documentFiles[i]);
      }
      if (hasNotes) { setLoadingStep('Uploading notes…'); await tryUploadNotes(appointmentId, notesText.trim()); }
      setLoadingStep('Juno is analyzing your visit…');
      const processResult = await tryProcessAppointment(appointmentId);
      const processedSoapNotes = processResult.soapNotes;
      const processedTitle = processResult.title ?? processResult.soapNotes?.title ?? null;

      // Set summary results immediately so they display even if questions fail
      setSoapNotes(processedSoapNotes);
      setTitle(processedTitle);

      // Generate questions separately — non-fatal
      setLoadingStep('Generating questions…');
      try {
        const questionsResult = await tryGenerateQuestions(appointmentId);
        const generatedQuestions = questionsResult?.questions;
        if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
          setQuestions(generatedQuestions);
        }
      } catch (questionsErr) {
        console.warn('Question generation failed (non-fatal):', questionsErr);
      }

      analyticsEvents.trySubmitSuccess(hasRecording, hasNotes);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message); analyticsEvents.trySubmitError(message);
    } finally { setIsLoading(false); setLoadingStep(''); }
  };

  // PDF Download
  const handleDownloadPDF = async () => {
    if (!summaryRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: 'Juno-Appointment-Summary.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(summaryRef.current).save();
    setShowDownloadModal(false);
  };

  // Feedback
  const handleFeedbackSubmit = async () => {
    if (helpfulness === 0) return;
    setFeedbackSubmitting(true);
    try {
      const lines = [`Source: try-page-feedback`, `Helpfulness: ${helpfulness}/5 stars`, `Feedback: ${feedbackText || '(none)'}`];
      if (recordingFile) lines.push(`Recording Size: ${recordingFile.size} bytes`);
      if (documentFiles.length > 0) lines.push(`Documents: ${documentFiles.length} file(s)`);
      if (notesText.trim().length > 0) lines.push(`Notes Length: ${notesText.length} characters`);
      await fetch('https://formspree.io/f/mjgeorjw', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: 'gitika.bose@gmail.com', message: lines.join('\n') }),
      });
      analyticsEvents.tryFeedbackSubmit(helpfulness);
      setFeedbackSent(true);
    } catch (err) { console.error('Failed to submit feedback:', err); }
    finally { setFeedbackSubmitting(false); }
  };

  // Waitlist
  const handleWaitlistSubmit = async (e: FormEvent) => {
    e.preventDefault(); setWaitlistStatus('submitting');
    try {
      const response = await fetch('https://formspree.io/f/mjgeorjw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail, source: 'try-page-waitlist' }),
      });
      if (response.ok) { setWaitlistStatus('success'); setWaitlistEmail(''); }
      else throw new Error('Submission failed');
    } catch { setWaitlistStatus('error'); }
  };

  const sortByImportance = <T extends { importance: 'high' | 'low' }>(items: T[]): T[] =>
    [...items].sort((a, b) => (a.importance === b.importance ? 0 : a.importance === 'high' ? -1 : 1));
  const allLowImportance = (items: { importance: 'high' | 'low' }[]) => items.every(i => i.importance === 'low');

  /* ── RENDER OUTPUT ── */
  // PLACEHOLDER — renderOutput will be added
  const renderOutput = (): ReactNode => {
    if (isLoading) return <div className="v2-output-center"><div className="v2-spinner" /><p className="v2-loading-text">{loadingStep}</p></div>;
    if (error) return <div className="v2-output-center"><div style={{ fontSize: '2rem' }}>⚠️</div><p className="v2-error-text">{error}</p></div>;
    if (!hasResults) return null;

    return (
      <div className="v2-results-wrapper">
        <div className="v2-results-header">
          <div className="v2-results-header-left">
            <div className="v2-results-check-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="v2-results-title">{title || 'Your Appointment Summary'}</h2>
          </div>
          <button className="v2-download-btn" onClick={() => setShowDownloadModal(true)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download Report
          </button>
        </div>

        <div ref={summaryRef}>
          {soapNotes?.summary && (
            <div className="v2-result-card">
              <div className="v2-result-section-header"><span className="v2-result-section-icon">📋</span><h3 className="v2-result-heading">Summary</h3></div>
              <p className="v2-result-body">{soapNotes.summary}</p>
            </div>
          )}

          {soapNotes?.diagnosis?.details && soapNotes.diagnosis.details.length > 0 && (
            <div className="v2-result-card">
              <div className="v2-result-section-header"><span className="v2-result-section-icon">🔍</span><h3 className="v2-result-heading">Diagnosis &amp; Assessment</h3></div>
              <div className="v2-result-items-list">
                {[...soapNotes.diagnosis.details].sort((a, b) => {
                  const o: Record<string, number> = { high: 0, medium: 1, low: 2 };
                  return (o[a.severity ?? ''] ?? 3) - (o[b.severity ?? ''] ?? 3);
                }).map((d, i) => (
                  <div key={i} className="v2-accent-item">
                    <div className="v2-accent-bar" style={{ backgroundColor: '#c44' }} />
                    <div className="v2-accent-content">
                      <div className="v2-result-item-title">{d.title}</div>
                      <div className="v2-result-item-desc">{d.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {soapNotes?.action_todo && soapNotes.action_todo.length > 0 && (
            <div className="v2-result-card">
              <div className="v2-result-section-header"><span className="v2-result-section-icon">✅</span><h3 className="v2-result-heading">Action Items</h3></div>
              <div className="v2-result-items-list">
                {sortByImportance(soapNotes.action_todo).map((todo, i) => (
                  <div key={i} className="v2-bullet-item"><span className="v2-bullet-dot" /><span className="v2-result-item-title">{todo.title}</span></div>
                ))}
              </div>
            </div>
          )}

          {soapNotes?.reason_for_visit && soapNotes.reason_for_visit.length > 0 && (
            <V2CollapsibleCard title="Reason for Visit" icon="🏥" defaultCollapsed={true}>
              <div className="v2-result-items-list">
                {soapNotes.reason_for_visit.map((item, i) => (
                  <div key={i} className="v2-accent-item">
                    <div className="v2-accent-bar" style={{ backgroundColor: '#A855F7' }} />
                    <div className="v2-accent-content">
                      <div className="v2-result-item-title">{item.reason}</div>
                      {item.description && <div className="v2-result-item-desc">{item.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </V2CollapsibleCard>
          )}

          {soapNotes?.tests && soapNotes.tests.length > 0 && (
            <V2CollapsibleCard title="Tests" icon="🧪" defaultCollapsed={allLowImportance(soapNotes.tests)}>
              <V2ImportanceSplitList items={sortByImportance(soapNotes.tests)} renderItem={(test, i) => (
                <div key={i} className="v2-todo-item" style={{ borderLeftColor: '#22C55E' }}>
                  <div className="v2-result-item-title">{test.title}</div>
                  {test.description && <div className="v2-result-item-desc">{test.description}</div>}
                </div>
              )} />
            </V2CollapsibleCard>
          )}

          {soapNotes?.medications && soapNotes.medications.length > 0 && (
            <V2CollapsibleCard title="Medications" icon="💊" defaultCollapsed={allLowImportance(soapNotes.medications)}>
              <V2ImportanceSplitList items={sortByImportance(soapNotes.medications)} renderItem={(med, i) => (
                <div key={i} className="v2-todo-item" style={{ borderLeftColor: '#3B82F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 2 }}>
                    <span className="v2-result-item-title">{med.title}</span>
                    {med.change && <span className="v2-change-badge">Changed</span>}
                  </div>
                  {med.instructions && <div className="v2-result-item-desc">{med.instructions}</div>}
                  {(med.dosage || med.frequency || med.timing || med.duration) && (
                    <div className="v2-todo-details">
                      {med.dosage && <span>💊 {med.dosage}</span>}
                      {med.frequency && <span>⏱️ {med.frequency}</span>}
                      {med.timing && <span>🕐 {med.timing}</span>}
                      {med.duration && <span>📅 {med.duration}</span>}
                    </div>
                  )}
                </div>
              )} />
            </V2CollapsibleCard>
          )}

          {soapNotes?.procedures && soapNotes.procedures.length > 0 && (
            <V2CollapsibleCard title="Procedures" icon="🩺" defaultCollapsed={allLowImportance(soapNotes.procedures)}>
              <V2ImportanceSplitList items={sortByImportance(soapNotes.procedures)} renderItem={(proc, i) => (
                <div key={i} className="v2-todo-item" style={{ borderLeftColor: '#A855F7' }}>
                  <div className="v2-result-item-title">{proc.title}</div>
                  {proc.description && <div className="v2-result-item-desc">{proc.description}</div>}
                  {proc.timeframe && <div className="v2-todo-details"><span>📅 {proc.timeframe}</span></div>}
                </div>
              )} />
            </V2CollapsibleCard>
          )}

          {soapNotes?.other && soapNotes.other.length > 0 && (
            <V2CollapsibleCard title="Other Instructions" icon="📋" defaultCollapsed={allLowImportance(soapNotes.other)}>
              <V2ImportanceSplitList items={sortByImportance(soapNotes.other)} renderItem={(item, i) => (
                <div key={i} className="v2-todo-item">
                  <div className="v2-result-item-title">{item.title}</div>
                  {item.description && <div className="v2-result-item-desc">{item.description}</div>}
                  {(item.dosage || item.frequency || item.timing || item.duration) && (
                    <div className="v2-todo-details">
                      {item.dosage && <span>💊 {item.dosage}</span>}
                      {item.frequency && <span>⏱️ {item.frequency}</span>}
                      {item.timing && <span>🕐 {item.timing}</span>}
                      {item.duration && <span>📅 {item.duration}</span>}
                    </div>
                  )}
                </div>
              )} />
            </V2CollapsibleCard>
          )}

          {soapNotes?.follow_up && soapNotes.follow_up.length > 0 && (
            <div className="v2-result-card">
              <div className="v2-result-section-header"><span className="v2-result-section-icon">📅</span><h3 className="v2-result-heading">Follow-up</h3></div>
              <div className="v2-result-items-list">
                {soapNotes.follow_up.map((item, i) => (
                  <div key={i} className="v2-followup-item">
                    <div className="v2-result-item-desc">{item.description}</div>
                    <div className="v2-followup-time">📅 {item.time_frame}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {soapNotes?.why_recommended && (
            <V2CollapsibleCard title="Why is this the plan?" icon="💡" defaultCollapsed={false}>
              <p className="v2-result-body">{soapNotes.why_recommended}</p>
            </V2CollapsibleCard>
          )}

          {questions && questions.length > 0 && (
            <div className="v2-result-card v2-questions-card">
              <h3 className="v2-result-heading">Recommended questions to ask your doctor</h3>
              <div className="v2-result-items-list" style={{ marginTop: '0.75rem' }}>
                {questions.map((q, i) => <div key={i} className="v2-question-item">{q}</div>)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Whether there's output to show (loading, error, or results)
  const showOutput = isLoading || error !== null || hasResults;

  /* ══ FULL RENDER ══ */
  return (
    <div ref={ref} id="explain-upload" className="v2-page-bg">
      {/* Main layout: side-by-side on large screens when output is visible */}
      <div className={`v2-main-layout${showOutput ? ' v2-main-layout--split' : ''}`}>
      {/* Upload */}
      <div className="v2-upload-section">
        <h2 className="v2-upload-title">Create Your Appointment Summary</h2>
        <p className="v2-upload-subtitle">Upload your recording and any notes to get started</p>

        {/* Recording */}
        <div className="v2-input-group">
          <label className="v2-input-label">🎙️ Appointment Recording <span className="v2-input-label-hint">(Optional)</span></label>
          <div className={`v2-drop-zone${recordingFile ? ' has-file' : ''}`}>
            <input ref={recordingInputRef} type="file" accept={ACCEPTED_AUDIO_TYPES} onChange={handleRecordingChange} disabled={isLoading} />
            <div className="v2-drop-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
            <div className="v2-drop-text">Drop your audio file here</div>
            <div className="v2-drop-browse">or click to browse</div>
            <div className="v2-drop-hint">MP3, WAV, M4A &bull; Up to 2 hours</div>
          </div>
          {recordingFile && (
            <div className="v2-file-chip">
              <span className="v2-file-chip-name">📎 {recordingFile.name}</span>
              <button className="v2-file-remove" onClick={handleRemoveRecording}>✕</button>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="v2-input-group">
          <label className="v2-input-label">📄 Post-Appointment Notes <span className="v2-input-label-hint">(Optional)</span></label>
          <label className="v2-input-label" style={{ fontSize: '0.9375rem' }}>Upload Doctor's Documents ({documentFiles.length}/{MAX_FILES})</label>
          {documentFiles.map((file, idx) => (
            <div key={idx} className="v2-file-chip">
              <span className="v2-file-chip-name">📎 {file.name}</span>
              <button className="v2-file-remove" onClick={() => handleRemoveDocument(idx)} disabled={isLoading}>✕</button>
            </div>
          ))}
          {documentFiles.length < MAX_FILES && (
            <div className="v2-drop-zone">
              <input ref={documentInputRef} type="file" accept={ACCEPTED_DOC_TYPES} onChange={handleDocumentChange} disabled={isLoading} multiple />
              <div className="v2-drop-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
              <div className="v2-drop-text">Drop documents here or click to browse</div>
              <div className="v2-drop-hint">PDF, DOC, DOCX, or images</div>
            </div>
          )}

          <div className="v2-divider"><span>or</span></div>

          <label className="v2-input-label">Type Your Notes</label>
          <textarea className="v2-textarea" placeholder="Enter any notes, instructions, or details from your appointment…" value={notesText} onChange={handleTextChange} maxLength={MAX_CHARS} disabled={isLoading} />
          <div className="v2-char-count">{charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}</div>
          <p className="v2-helper-text">You can add both documents and typed notes</p>
        </div>

        <button className="v2-submit-btn" disabled={!canSubmit} onClick={handleSubmit}>
          {isLoading ? 'Processing…' : 'Generate Summary'}
        </button>
        <p className="v2-privacy-note">Your privacy is protected. All files are processed securely and never stored.</p>
      </div>

      {/* Output */}
      {renderOutput()}
      </div>{/* close v2-main-layout */}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="v2-modal-overlay" onClick={() => setShowDownloadModal(false)}>
          <div className="v2-modal" onClick={e => e.stopPropagation()}>
            <div className="v2-modal-header">
              <h3 className="v2-modal-title">Download Report</h3>
              <button className="v2-modal-close" onClick={() => setShowDownloadModal(false)}>✕</button>
            </div>
            <p className="v2-modal-body">Download a PDF copy of your appointment summary to your device.</p>
            <div className="v2-modal-actions">
              <button className="v2-modal-btn-outline" onClick={() => setShowDownloadModal(false)}>Cancel</button>
              <button className="v2-modal-btn-primary" onClick={handleDownloadPDF}>Download</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      <section id="feedback" className="v2-feedback-section">
        <h2 className="v2-feedback-title">Help Us Improve</h2>
        <p className="v2-feedback-subtitle">Your feedback makes Juno better</p>
        <div className="v2-feedback-card">
          <p className="v2-feedback-label">Was this helpful?</p>
          <div className="v2-stars">
            {[1,2,3,4,5].map(star => (
              <button key={star} className={`v2-star${star <= (hoverRating || helpfulness) ? ' filled' : ''}`}
                onClick={() => setHelpfulness(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}>★</button>
            ))}
          </div>
          <div className="v2-feedback-question">
            <label>What was confusing or missing? <span>(optional)</span></label>
            <textarea className="v2-feedback-textarea" placeholder="Share your thoughts…" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
          </div>
          <button className="v2-feedback-submit" disabled={helpfulness === 0 || feedbackSubmitting || feedbackSent} onClick={handleFeedbackSubmit}>
            {feedbackSent ? 'Thanks for your feedback!' : feedbackSubmitting ? 'Sending…' : 'Submit Feedback'}
          </button>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="v2-coming-soon">
        <h2 className="v2-coming-soon-title">Coming Soon to the Juno App</h2>
        <p className="v2-coming-soon-subtitle">We're building more features to make healthcare easier to understand and manage</p>
        <div className="v2-features-grid">
          <div className="v2-feature-card">
            <div className="v2-feature-icon-circle"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
            <h3>Live Recording</h3>
            <p>Record appointments directly in the app with real-time transcription and instant summaries</p>
          </div>
          <div className="v2-feature-card">
            <div className="v2-feature-icon-circle"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
            <h3>Smart Reminders</h3>
            <p>Get gentle notifications for medications, appointments, and action items from your visits</p>
          </div>
          <div className="v2-feature-card">
            <div className="v2-feature-icon-circle"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
            <h3>Health Timeline</h3>
            <p>View all your appointments, summaries, and health updates in one easy-to-read timeline</p>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="v2-waitlist">
        <div className="v2-waitlist-card">
          <h2 className="v2-waitlist-title">Join the Waitlist</h2>
          <p className="v2-waitlist-subtitle">Be among the first to get free early access to the Juno app. We'll reach out to you shortly!</p>
          {waitlistStatus === 'success' ? (
            <p className="v2-waitlist-success">🎉 You're on the list! We'll be in touch soon.</p>
          ) : (
            <form onSubmit={handleWaitlistSubmit}>
              <input type="email" className="v2-waitlist-input" placeholder="Enter your email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} required disabled={waitlistStatus === 'submitting'} />
              <button type="submit" className="v2-waitlist-btn" disabled={waitlistStatus === 'submitting'}>
                {waitlistStatus === 'submitting' ? 'Signing up…' : 'Get Early Access'}
              </button>
              {waitlistStatus === 'error' && <p className="v2-waitlist-error">Something went wrong. Please try again.</p>}
            </form>
          )}
        </div>
      </section>

      <div className="v2-mini-footer">Made with care for clarity and comfort</div>
    </div>
  );
});

ExplainAppComponentV2.displayName = 'ExplainAppComponentV2';
export default ExplainAppComponentV2;

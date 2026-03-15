import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  isSupported as analyticsIsSupported,
} from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

import { app } from './firebase';

// =============================================================================
// Analytics initialisation – web only
// =============================================================================

let analytics: Analytics | null = null;

(async () => {
  try {
    if (await analyticsIsSupported()) {
      analytics = getAnalytics(app);
    }
  } catch {
    // Analytics not available – that's fine
  }
})();

// =============================================================================
// Analytics helpers
// =============================================================================

export const logAnalyticsEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>,
) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, `landing_${eventName}`, eventParams);
    } catch {
      // Silently ignore analytics failures
    }
  }
};

export const analyticsEvents = {
  // ---------------------------------------------------------------------------
  // Landing Page
  // ---------------------------------------------------------------------------
  landingPageOpen: () => logAnalyticsEvent('page_open'),
  heroClickGetStarted: () => logAnalyticsEvent('hero_click_get_started'),
  heroClickJoinWaitlist: () => logAnalyticsEvent('hero_click_join_waitlist'),

  // ---------------------------------------------------------------------------
  // Upload / Submit Flow  (ExplainAppComponentV2, embedded in NewLandingPage)
  // ---------------------------------------------------------------------------
  tryPageOpen: () => logAnalyticsEvent('page_open'),
  tryUploadFile: (fileSize: number, fileType: string, inputType: 'recording' | 'document') =>
    logAnalyticsEvent('upload_file', { file_size: fileSize, file_type: fileType, input_type: inputType }),
  trySubmit: (hasRecording: boolean, hasNotes: boolean, hasDocuments: boolean, documentCount: number) =>
    logAnalyticsEvent('submit', {
      has_recording: hasRecording,
      has_notes: hasNotes,
      has_documents: hasDocuments,
      document_count: documentCount,
    }),
  trySubmitSuccess: (hasRecording: boolean, hasNotes: boolean, hasDocuments: boolean) =>
    logAnalyticsEvent('submit_success', {
      has_recording: hasRecording,
      has_notes: hasNotes,
      has_documents: hasDocuments,
    }),
  trySubmitError: (errorMessage: string) =>
    logAnalyticsEvent('submit_error', { error_message: errorMessage }),

  // ---------------------------------------------------------------------------
  // Engagement
  // ---------------------------------------------------------------------------
  notesStarted: () => logAnalyticsEvent('notes_started'),
  tryFeedbackSubmit: (rating: number) =>
    logAnalyticsEvent('feedback_submit', { rating }),
  waitlistSubmit: () => logAnalyticsEvent('waitlist_submit'),
  waitlistSubmitSuccess: () => logAnalyticsEvent('waitlist_submit_success'),
  waitlistSubmitError: () => logAnalyticsEvent('waitlist_submit_error'),
};

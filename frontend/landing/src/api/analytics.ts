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
      firebaseLogEvent(analytics, eventName, eventParams);
    } catch {
      // Silently ignore analytics failures
    }
  }
};

export const analyticsEvents = {
  finalizeAppointment: () => logAnalyticsEvent('finalize_appointment'),
  uploadRecording: (fileSize?: number) =>
    logAnalyticsEvent('upload_recording', { file_size: fileSize }),

  // ---------------------------------------------------------------------------
  // Landing Page
  // ---------------------------------------------------------------------------
  landingPageOpen: () => logAnalyticsEvent('landing_page_open'),
  landingClickTryNow: (location: string) =>
    logAnalyticsEvent('landing_click_try_now', { location }),
  landingClickJoinBeta: (location: string) =>
    logAnalyticsEvent('landing_click_join_beta', { location }),
  landingClickGetStarted: () => logAnalyticsEvent('landing_click_get_started'),
  landingClickNavLink: (target: string) =>
    logAnalyticsEvent('landing_click_nav_link', { target }),

  // ---------------------------------------------------------------------------
  // Try Page
  // ---------------------------------------------------------------------------
  tryPageOpen: () => logAnalyticsEvent('try_page_open'),
  tryUploadFile: (fileSize: number, fileType: string) =>
    logAnalyticsEvent('try_upload_file', { file_size: fileSize, file_type: fileType }),
  tryRemoveFile: () => logAnalyticsEvent('try_remove_file'),
  trySubmit: (hasRecording: boolean, hasNotes: boolean) =>
    logAnalyticsEvent('try_submit', { has_recording: hasRecording, has_notes: hasNotes }),
  trySubmitSuccess: (hasRecording: boolean, hasNotes: boolean) =>
    logAnalyticsEvent('try_submit_success', {
      has_recording: hasRecording,
      has_notes: hasNotes,
    }),
  trySubmitError: (errorMessage: string) =>
    logAnalyticsEvent('try_submit_error', { error_message: errorMessage }),
  tryFeedbackSubmit: (rating: number) =>
    logAnalyticsEvent('try_feedback_submit', { rating }),
  tryClickBackHome: () => logAnalyticsEvent('try_click_back_home'),
  tryToggleLearnings: (expanded: boolean) =>
    logAnalyticsEvent('try_toggle_learnings', { expanded }),
};

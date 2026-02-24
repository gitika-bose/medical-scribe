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
};

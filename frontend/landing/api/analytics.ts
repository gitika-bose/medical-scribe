import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  isSupported as analyticsIsSupported,
  type Analytics,
} from 'firebase/analytics';
import { Platform } from 'react-native';

import { app } from './firebase';

// =============================================================================
// Analytics initialisation – only available on web; gracefully no-ops on native
// =============================================================================

let analytics: Analytics | null = null;
(async () => {
  try {
    if (Platform.OS === 'web' && (await analyticsIsSupported())) {
      analytics = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized');
    }
  } catch {
    // Analytics not available on this platform – that's fine
  }
})();

// =============================================================================
// Analytics helpers
// =============================================================================

export const logAnalyticsEvent = (
  eventName: string,
  eventParams?: Record<string, any>,
) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, eventParams);
      console.log(`📊 Analytics event: ${eventName}`, eventParams);
    } catch (error) {
      console.warn('⚠️ Failed to log analytics event:', error);
    }
  }
};

export const analyticsEvents = {
  finalizeAppointment: () =>
    logAnalyticsEvent('finalize_appointment'),
  appOpen: () => logAnalyticsEvent('app_open'),
  generateQuestions: () =>
    logAnalyticsEvent('generate_questions'),
  uploadRecording: (fileSize?: number) =>
    logAnalyticsEvent('upload_recording', {
      file_size: fileSize
    })
};

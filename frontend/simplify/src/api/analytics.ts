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

const log = (eventName: string, eventParams?: Record<string, unknown>) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, `simplify_${eventName}`, eventParams);
    } catch {
      // Silently ignore analytics failures
    }
  }
};

export const analyticsEvents = {
  pageOpen:      () => log('page_open'),
  fileAdded:     (fileCount: number, fileTypes: string, inputMethod: 'picker' | 'drop') =>
    log('file_added', { file_count: fileCount, file_types: fileTypes, input_method: inputMethod }),
  fileRemoved:   () => log('file_removed'),
  submit:        (fileCount: number, fileTypes: string) =>
    log('submit', { file_count: fileCount, file_types: fileTypes }),
  submitSuccess: (docType: string) => log('submit_success', { doc_type: docType }),
  submitError:   (errorMessage: string) => log('submit_error', { error_message: errorMessage }),
  download:      (docType: string) => log('download', { doc_type: docType }),
  simplifyAnother: () => log('simplify_another'),
};

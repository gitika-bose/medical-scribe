import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  startAppointment, uploadRecordingNew, uploadDocument,
  uploadNotes, processAppointment,
} from '@/api/appointments';
import { store } from '@/store';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { GuestDisclaimer } from '@/components/shared/GuestDisclaimer';
import { Colors } from '@/constants/Colors';

const MAX_CHARS = 10000;
const MAX_DOCS = 5;

interface FileInfo { uri: string; name: string; mimeType?: string; size?: number; }

export default function ExplainMyAppointmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPhone, isDesktop } = useResponsiveLayout();

  const [recordingFile, setRecordingFile] = useState<FileInfo | null>(null);
  const [documentFiles, setDocumentFiles] = useState<FileInfo[]>([]);
  const [notesText, setNotesText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRecording = recordingFile !== null;
  const hasDocuments = documentFiles.length > 0;
  const hasNotes = notesText.trim().length > 0;
  const canSubmit = (hasRecording || hasDocuments || hasNotes) && !isLoading;

  const handlePickRecording = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const f = result.assets[0];
    setRecordingFile({ uri: f.uri, name: f.name, mimeType: f.mimeType || undefined, size: f.size || undefined });
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf'], copyToCacheDirectory: true, multiple: true });
    if (result.canceled || !result.assets) return;
    const remaining = MAX_DOCS - documentFiles.length;
    const toAdd = result.assets.slice(0, remaining).map(f => ({ uri: f.uri, name: f.name, mimeType: f.mimeType || undefined, size: f.size || undefined }));
    setDocumentFiles(prev => [...prev, ...toAdd]);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { appointmentId } = await startAppointment();
      store.setLastCompletedAppointmentId(appointmentId);

      router.replace('/(tabs)/appointments' as any);

      (async () => {
        try {
          if (hasRecording) {
            await uploadRecordingNew(appointmentId, recordingFile!);
          }
          for (let i = 0; i < documentFiles.length; i++) {
            await uploadDocument(appointmentId, documentFiles[i]);
          }
          if (hasNotes) {
            await uploadNotes(appointmentId, notesText.trim());
          }
          processAppointment(appointmentId).catch((err) => {
            console.error('Background processing error:', err);
          });
        } catch (err) {
          console.error('Background upload error:', err);
        }
      })();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isPhone && styles.headerTitlePhone]}>Explain My Appointment</Text>
        <View style={{ width: 38 }} />
      </View>
      <GuestDisclaimer />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerContent, isDesktop && styles.innerContentDesktop]}>
          {/* Brief explanation */}
          <Text style={[styles.explanationText, isPhone && styles.explanationTextPhone]}>
            Upload appointment recordings, documents, or notes.{'\n'}Juno explains everything in plain language.
          </Text>

          {/* Error */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Recording */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🎙️ Recording</Text>
            <TouchableOpacity style={[styles.fileUpload, hasRecording && styles.fileUploadHasFile]} onPress={handlePickRecording} disabled={isLoading}>
              <Ionicons name="musical-notes-outline" size={28} color={hasRecording ? Colors.primary : Colors.gray[400]} />
              <Text style={styles.fileUploadText}>{hasRecording ? 'File selected' : 'Upload a recording'}</Text>
              <Text style={styles.fileUploadHint}>Audio files up to 25 MB</Text>
              {recordingFile && (
                <View style={styles.fileName}>
                  <Text style={styles.fileNameText} numberOfLines={1}>📎 {recordingFile.name}</Text>
                  <TouchableOpacity onPress={() => setRecordingFile(null)}><Text style={styles.fileRemove}>✕</Text></TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Documents */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📄 Files ({documentFiles.length}/{MAX_DOCS})</Text>
            {documentFiles.map((f, i) => (
              <View key={i} style={styles.docItem}>
                <Text style={styles.docItemName} numberOfLines={1}>📎 {f.name}</Text>
                <TouchableOpacity onPress={() => setDocumentFiles(prev => prev.filter((_, idx) => idx !== i))} disabled={isLoading}>
                  <Text style={styles.fileRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {documentFiles.length < MAX_DOCS && (
              <TouchableOpacity style={styles.docUploadArea} onPress={handlePickDocument} disabled={isLoading}>
                <Ionicons name="add-circle-outline" size={22} color={Colors.accent4} />
                <Text style={styles.docUploadText}>{documentFiles.length === 0 ? 'Upload PDF files' : 'Add more files'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📝 Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Doctor said blood pressure is borderline high, start 5mg amlodipine daily…"
              placeholderTextColor={Colors.gray[400]}
              value={notesText}
              onChangeText={t => { if (t.length <= MAX_CHARS) setNotesText(t); }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={[styles.charCount, notesText.length >= MAX_CHARS && { color: Colors.red[600] }]}>
              {notesText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
            <Text style={styles.submitButtonText}>{isLoading ? 'Processing…' : 'Explain this visit'}</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>Files deleted after processing</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightBackground },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.background,
  },
  backButton: { padding: 8, borderRadius: 999 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  scrollContentDesktop: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 32 },
  innerContent: { width: '100%' },
  innerContentDesktop: { maxWidth: 640, width: '100%' },

  explanationText: {
    fontSize: 16,
    color: Colors.mutedForeground,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  explanationTextPhone: { fontSize: 14, lineHeight: 22, marginBottom: 18 },

  // Error
  errorCard: {
    padding: 14, backgroundColor: Colors.red[50],
    borderWidth: 1, borderColor: Colors.red[300], borderRadius: 12, marginBottom: 16,
  },
  errorText: { fontSize: 14, color: Colors.red[700] },

  // Input groups
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 15, fontWeight: '600', color: Colors.foreground, marginBottom: 8 },
  fileUpload: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border,
    borderRadius: 14, padding: 20, alignItems: 'center', backgroundColor: Colors.surfaceBackground,
  },
  fileUploadHasFile: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  fileUploadText: { fontSize: 15, color: Colors.mutedForeground, marginTop: 6 },
  fileUploadHint: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  fileName: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  fileNameText: { fontSize: 13, color: Colors.primary, fontWeight: '500', flex: 1 },
  fileRemove: { fontSize: 16, color: Colors.gray[400], paddingHorizontal: 4 },

  docItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, backgroundColor: Colors.primaryMuted,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 10, marginBottom: 6,
  },
  docItemName: { fontSize: 13, color: Colors.primary, fontWeight: '500', flex: 1 },
  docUploadArea: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border,
    borderRadius: 10, padding: 14, backgroundColor: Colors.surfaceBackground,
  },
  docUploadText: { fontSize: 14, color: Colors.mutedForeground },

  notesInput: {
    borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12,
    padding: 14, fontSize: 15, color: Colors.foreground,
    backgroundColor: Colors.background, minHeight: 140, textAlignVertical: 'top',
  },
  charCount: { textAlign: 'right', fontSize: 12, color: Colors.gray[400], marginTop: 4 },

  submitButton: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disclaimer: { textAlign: 'center', fontSize: 12, color: Colors.gray[400], marginTop: 8 },

  // Phone overrides
  headerTitlePhone: { fontSize: 16 },
});

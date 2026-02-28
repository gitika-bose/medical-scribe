import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  startAppointment, uploadRecordingNew, uploadDocument,
  uploadNotes, processAppointment, generateQuestions,
} from '@/api/appointments';
import { store } from '@/store';
import { GuestDisclaimer } from '@/components/shared/GuestDisclaimer';
import { Colors } from '@/constants/Colors';

const MAX_CHARS = 10000;
const MAX_DOCS = 5;

interface SoapNotesV13 {
  title?: string;
  summary?: string;
  reason_for_visit?: Array<{ reason: string; description: string }>;
  diagnosis?: { details: Array<{ title: string; description: string; severity?: string }> };
  tests?: Array<{ title: string; description: string; importance: string }>;
  medications?: Array<{ title: string; dosage?: string; frequency?: string; timing?: string; duration?: string; instructions?: string; importance: string; change?: boolean }>;
  procedures?: Array<{ title: string; description: string; timeframe?: string; importance: string }>;
  other?: Array<{ title: string; description: string; dosage?: string; frequency?: string; timing?: string; duration?: string; importance: string }>;
  follow_up?: Array<{ description: string; time_frame: string }>;
  why_recommended?: string;
  action_todo?: Array<{ title: string; importance: string }>;
}

interface FileInfo { uri: string; name: string; mimeType?: string; size?: number; }

export default function ExplainMyAppointmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isPhone = width < 600;

  const [recordingFile, setRecordingFile] = useState<FileInfo | null>(null);
  const [documentFiles, setDocumentFiles] = useState<FileInfo[]>([]);
  const [notesText, setNotesText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [soapNotes, setSoapNotes] = useState<SoapNotesV13 | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasRecording = recordingFile !== null;
  const hasDocuments = documentFiles.length > 0;
  const hasNotes = notesText.trim().length > 0;
  const canSubmit = (hasRecording || hasDocuments || hasNotes) && !isLoading;
  const hasResults = soapNotes !== null || questions !== null;

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

      // Navigate to appointments immediately
      router.replace('/(tabs)/appointments' as any);

      // Upload and process in the background
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

  const renderInputSection = () => (
    <View style={s.inputSection}>
      {/* Recording */}
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>🎙️ Recording</Text>
        <TouchableOpacity style={[s.fileUpload, hasRecording && s.fileUploadHasFile]} onPress={handlePickRecording} disabled={isLoading}>
          <Ionicons name="musical-notes-outline" size={28} color={hasRecording ? Colors.teal[600] : Colors.gray[400]} />
          <Text style={s.fileUploadText}>{hasRecording ? 'File selected' : 'Upload a recording'}</Text>
          <Text style={s.fileUploadHint}>Audio files up to 25 MB</Text>
          {recordingFile && (
            <View style={s.fileName}>
              <Text style={s.fileNameText} numberOfLines={1}>📎 {recordingFile.name}</Text>
              <TouchableOpacity onPress={() => setRecordingFile(null)}><Text style={s.fileRemove}>✕</Text></TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Documents */}
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>📄 Files ({documentFiles.length}/{MAX_DOCS})</Text>
        {documentFiles.map((f, i) => (
          <View key={i} style={s.docItem}>
            <Text style={s.docItemName} numberOfLines={1}>📎 {f.name}</Text>
            <TouchableOpacity onPress={() => setDocumentFiles(prev => prev.filter((_, idx) => idx !== i))} disabled={isLoading}>
              <Text style={s.fileRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {documentFiles.length < MAX_DOCS && (
          <TouchableOpacity style={s.docUploadArea} onPress={handlePickDocument} disabled={isLoading}>
            <Ionicons name="add-circle-outline" size={22} color={Colors.accent4} />
            <Text style={s.docUploadText}>{documentFiles.length === 0 ? 'Upload PDF files' : 'Add more files'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes */}
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>📝 Notes</Text>
        <TextInput
          style={s.notesInput}
          placeholder="Doctor said blood pressure is borderline high, start 5mg amlodipine daily…"
          placeholderTextColor={Colors.gray[400]}
          value={notesText}
          onChangeText={t => { if (t.length <= MAX_CHARS) setNotesText(t); }}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!isLoading}
        />
        <Text style={[s.charCount, notesText.length >= MAX_CHARS && { color: Colors.red[600] }]}>
          {notesText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </Text>
      </View>

      {/* Submit */}
      <TouchableOpacity style={[s.submitButton, !canSubmit && s.submitButtonDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
        <Text style={s.submitButtonText}>{isLoading ? 'Processing…' : 'Explain this visit'}</Text>
      </TouchableOpacity>
      <Text style={s.disclaimer}>Files deleted after processing</Text>
    </View>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, isPhone && s.headerTitlePhone]}>Explain My Appointment</Text>
        <View style={{ width: 38 }} />
      </View>
      <GuestDisclaimer />
      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brief explanation */}
        <View>
          <Text style={[s.explanationBannerText, isPhone && s.explanationBannerTextPhone]}>
            Upload appointment recordings, documents, or notes. <br /> Juno explains everything in plain language.
          </Text>
        </View>
        {renderInputSection()}
      </ScrollView>
    </View>
  );
}

function ResultCard({ icon, heading, children }: { icon: string; heading: string; children: React.ReactNode }) {
  return (
    <View style={s.resultCard}>
      <View style={s.resultHeader}><Text style={s.resultIcon}>{icon}</Text><Text style={s.resultHeading}>{heading}</Text></View>
      <View style={s.resultBody}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightBackground },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.background },
  backButton: { padding: 8, borderRadius: 999 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  // Explanation banner
  explanationBanner: {
    padding: 12,
    backgroundColor: Colors.blue[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.blue[300],
    marginBottom: 16,
  },
  explanationBannerText: {
    fontSize: Platform.select({ ios: 14, android: 14, web: 20 }),
    color: Colors.mutedForeground,
    lineHeight: Platform.select({ ios: 24, android: 24, web: 30 }),
    textAlign: 'center',
    marginBottom: 15,
  },

  // Input section
  inputSection: { marginBottom: 24 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 15, fontWeight: '600', color: Colors.primary, marginBottom: 8 },
  fileUpload: { borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border, borderRadius: 12, padding: 20, alignItems: 'center', backgroundColor: Colors.gray[50] },
  fileUploadHasFile: { borderColor: Colors.teal[600], backgroundColor: Colors.teal[50] },
  fileUploadText: { fontSize: 15, color: Colors.mutedForeground, marginTop: 6 },
  fileUploadHint: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  fileName: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  fileNameText: { fontSize: 13, color: Colors.teal[600], fontWeight: '500', flex: 1 },
  fileRemove: { fontSize: 16, color: Colors.gray[400], paddingHorizontal: 4 },

  docItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: Colors.teal[50], borderWidth: 1, borderColor: Colors.teal[600], borderRadius: 10, marginBottom: 6 },
  docItemName: { fontSize: 13, color: Colors.teal[600], fontWeight: '500', flex: 1 },
  docUploadArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border, borderRadius: 10, padding: 14, backgroundColor: Colors.gray[50] },
  docUploadText: { fontSize: 14, color: Colors.mutedForeground },

  notesInput: { borderWidth: 1, borderColor: Colors.gray[300], borderRadius: 10, padding: 14, fontSize: 15, color: Colors.foreground, backgroundColor: '#fff', minHeight: 140, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', fontSize: 12, color: Colors.gray[400], marginTop: 4 },

  submitButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disclaimer: { textAlign: 'center', fontSize: 12, color: Colors.gray[400], marginTop: 8 },

  // Loading
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 14, fontSize: 15, color: Colors.mutedForeground, fontWeight: '500' },

  // Error
  errorCard: { alignItems: 'center', padding: 20 },
  errorIcon: { fontSize: 28, marginBottom: 8 },
  errorText: { fontSize: 14, color: Colors.red[600], textAlign: 'center' },

  // Results
  resultsContainer: { gap: 14 },
  resultsTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 4 },

  resultCard: { backgroundColor: '#fff', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: Colors.gray[200] },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  resultIcon: { fontSize: 18 },
  resultHeading: { fontSize: 16, fontWeight: '600', color: Colors.foreground },
  resultBody: { gap: 10 },

  bodyText: { fontSize: 14, color: Colors.gray[700], lineHeight: 21 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginBottom: 2 },
  itemDesc: { fontSize: 14, color: Colors.gray[500], lineHeight: 20 },

  diagnosisItem: { flexDirection: 'row', gap: 10 },
  diagnosisAccent: { width: 4, backgroundColor: Colors.red[500], borderRadius: 2 },
  reasonItem: { flexDirection: 'row', gap: 10 },

  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  actionBullet: { fontSize: 18, color: Colors.teal[600] },

  todoItem: { borderLeftWidth: 4, borderLeftColor: '#F97316', paddingLeft: 12, paddingVertical: 6, backgroundColor: Colors.gray[50], borderRadius: 8, marginBottom: 4 },
  todoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  changeBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  changeBadgeText: { fontSize: 11, color: '#B45309', fontWeight: '500' },
  todoDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  detailText: { fontSize: 13, color: Colors.gray[700] },

  followUpItem: { backgroundColor: Colors.blue[50], borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.blue[300] },
  followUpTime: { fontSize: 14, color: Colors.blue[700], fontWeight: '500', marginTop: 6 },

  questionsCard: { backgroundColor: Colors.teal[50], borderRadius: 12, padding: 18, borderLeftWidth: 4, borderLeftColor: Colors.teal[600] },
  questionsHeading: { fontSize: 16, fontWeight: '600', color: Colors.foreground, marginBottom: 10 },
  questionItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.teal[100], marginBottom: 8 },
  questionText: { fontSize: 14, color: Colors.gray[700], lineHeight: 20 },

  // Phone-specific responsive overrides (width < 600)
  headerTitlePhone: { fontSize: 16 },
  explanationBannerTextPhone: { fontSize: 14, lineHeight: 22, marginBottom: 10 },
});

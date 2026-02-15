import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuestionsModalProps {
  visible: boolean;
  questions: string[];
  onClose: () => void;
}

/**
 * Full-screen modal that displays AI-generated questions during a recording.
 */
export function QuestionsModal({ visible, questions, onClose }: QuestionsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.title}>Suggested Questions</Text>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {questions.map((question, index) => (
              <View key={index} style={styles.questionCard}>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  list: {
    flexGrow: 0,
  },
  questionCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface QuestionsItem {
  question1?: string;
  question2?: string;
  question3?: string;
}

interface QuestionsSectionProps {
  questions: QuestionsItem[];
}

export function QuestionsSection({ questions }: QuestionsSectionProps) {
  if (!questions || questions.length === 0) return null;

  const questionObj = questions[0];
  const extracted = [questionObj.question1, questionObj.question2, questionObj.question3].filter(
    (q): q is string => typeof q === 'string' && q.trim().length > 0,
  );

  if (extracted.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
        <Text style={styles.heading}>Recommended questions to ask your doctor</Text>
      </View>
      <View style={styles.list}>
        {extracted.map((q, index) => (
          <View key={index} style={styles.questionItem}>
            <Text style={styles.questionText}>{q}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  list: {
    gap: 10,
  },
  questionItem: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  questionText: {
    fontSize: 15,
    color: '#0369A1',
    lineHeight: 22,
  },
});

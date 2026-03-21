import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: March 2026</Text>

        <Text style={styles.body}>
          Juno ("we", "our", or "us") provides a tool that helps users better understand medical
          conversations and documents by generating structured summaries and explanations in plain
          language.
        </Text>
        <Text style={styles.body}>
          This Privacy Policy explains how we collect, use, and handle information when you use the
          Juno website and services.
        </Text>

        <Text style={styles.sectionTitle}>1. Information You Provide</Text>
        <Text style={styles.body}>When using Juno, you may choose to upload or submit information such as:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Audio recordings of medical appointments</Text>
          <Text style={styles.bulletItem}>• Medical documents or reports</Text>
          <Text style={styles.bulletItem}>• Typed or written notes</Text>
          <Text style={styles.bulletItem}>• Other information you voluntarily submit for summarization</Text>
        </View>
        <Text style={styles.body}>
          This information may contain personal or sensitive information, including health-related
          information.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.body}>
          Information you submit is used{' '}
          <Text style={styles.bold}>
            only for the purpose of generating summaries, explanations, and follow-up questions
          </Text>{' '}
          through our AI processing system.
        </Text>
        <Text style={styles.body}>Specifically, submitted information is used to:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Generate structured summaries of medical conversations or documents</Text>
          <Text style={styles.bulletItem}>• Translate complex medical information into plain language</Text>
          <Text style={styles.bulletItem}>• Suggest potential follow-up questions for your healthcare provider</Text>
        </View>
        <Text style={styles.body}>
          Juno{' '}
          <Text style={styles.bold}>
            does not provide medical advice, diagnosis, or treatment recommendations
          </Text>
          .
        </Text>

        <Text style={styles.sectionTitle}>3. Data Retention</Text>
        <Text style={styles.body}>Juno is designed to minimize data retention.</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            • Uploaded files and submitted information are processed temporarily to generate results.
          </Text>
          <Text style={styles.bulletItem}>
            • We{' '}
            <Text style={styles.bold}>
              do not store recordings, documents, notes, or summaries after processing is complete
            </Text>
            .
          </Text>
          <Text style={styles.bulletItem}>
            • Submitted content is{' '}
            <Text style={styles.bold}>deleted automatically after processing</Text>.
          </Text>
        </View>
        <Text style={styles.body}>
          Because of this design, we{' '}
          <Text style={styles.bold}>do not maintain long-term records of your submissions</Text>.
        </Text>

        <Text style={styles.sectionTitle}>4. Infrastructure and Service Providers</Text>
        <Text style={styles.body}>
          Juno uses trusted cloud infrastructure and services to operate the platform, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            • <Text style={styles.bold}>Google Cloud Platform</Text> for hosting and infrastructure
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.bold}>Firebase</Text> for application services and infrastructure
          </Text>
        </View>
        <Text style={styles.body}>
          These providers may process data temporarily as required to operate the service. They are
          subject to their own security and privacy practices.
        </Text>

        <Text style={styles.sectionTitle}>5. Security</Text>
        <Text style={styles.body}>
          We take reasonable measures to protect information during transmission and processing,
          including secure infrastructure and encrypted connections.
        </Text>

        <Text style={styles.sectionTitle}>6. Cookies and Technical Data</Text>
        <Text style={styles.body}>
          Like most websites, we may collect limited technical information automatically, such as:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Browser type</Text>
          <Text style={styles.bulletItem}>• Device type</Text>
          <Text style={styles.bulletItem}>• General usage analytics</Text>
          <Text style={styles.bulletItem}>• IP address</Text>
        </View>
        <Text style={styles.body}>
          This information is used only to maintain service reliability and improve the product.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time as the product evolves. Updates will
          be posted on this page with a revised date.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact</Text>
        <Text style={styles.body}>
          If you have questions about this Privacy Policy, you may contact us at:{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('mailto:support@meetjuno.health')}
          >
            support@meetjuno.health
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 12,
  },
  lastUpdated: {
    fontSize: 13,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.foreground,
    marginTop: 8,
    marginBottom: 2,
  },
  body: {
    fontSize: 15,
    color: Colors.foreground,
    lineHeight: 23,
  },
  bold: {
    fontWeight: '700',
  },
  bulletList: {
    gap: 6,
    paddingLeft: 4,
  },
  bulletItem: {
    fontSize: 15,
    color: Colors.foreground,
    lineHeight: 23,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import NotepadIllustration from '../assets/images/NotepadIllustration';

const ONBOARDING_KEY = 'hasSeenOnboarding';
const MIN_SWIPE_DISTANCE = 50;
const TOTAL_PAGES = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (nextPage: number) => {
    setCurrentPage(nextPage);
  };

  const handleNext = () => {
    if (currentPage < TOTAL_PAGES - 1) {
      animateTransition(currentPage + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      animateTransition(currentPage - 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/login');
  };

  // Swipe gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -MIN_SWIPE_DISTANCE && currentPage < TOTAL_PAGES - 1) {
          handleNext();
        } else if (gestureState.dx > MIN_SWIPE_DISTANCE && currentPage > 0) {
          handlePrevious();
        }
      },
    })
  ).current;

  const renderPage = () => {
    switch (currentPage) {
      case 0:
        return (
          <View style={styles.pageContent}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logoLarge}
              resizeMode="contain"
            />
            <Text style={styles.heading}>Meet Juno</Text>
            <Text style={styles.description}>
              Get medical clarity, when it matters most.
            </Text>
          </View>
        );

      case 1:
        return (
          <View style={styles.pageContent}>
            <View style={styles.illustrationContainer}>
              <NotepadIllustration />
            </View>
            <Text style={styles.descriptionLong}>
              With your privacy at the forefront, Juno will listen in your appointments,
              take meticulous notes, generate questions for your doctor, and support you
              through your medical journey
            </Text>
          </View>
        );

      case 2:
        return (
          <View style={styles.pageContent}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logoMedium}
              resizeMode="contain"
            />
            <Text style={styles.subheading}>Ready to get started?</Text>
            <TouchableOpacity style={styles.continueButton} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.continueButtonText}>Continue to Login</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Main Content */}
      <View style={styles.mainContent}>
        <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
          {renderPage()}
        </Animated.View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Navigation Row */}
        <View style={styles.navRow}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentPage === 0}
            style={styles.navButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={currentPage === 0 ? '#D1D5DB' : '#111'}
            />
          </TouchableOpacity>

          {/* Page Indicators */}
          <View style={styles.indicators}>
            {[0, 1, 2].map((page) => (
              <TouchableOpacity
                key={page}
                onPress={() => animateTransition(page)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.indicator,
                    currentPage === page ? styles.indicatorActive : styles.indicatorInactive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity onPress={handleNext} style={styles.navButton} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        {currentPage < 2 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  animatedContent: {
    width: '100%',
    maxWidth: 400,
  },
  pageContent: {
    alignItems: 'center',
  },
  logoLarge: {
    width: 256,
    height: 256,
    marginBottom: 32,
  },
  logoMedium: {
    width: 192,
    height: 192,
    marginBottom: 24,
  },
  heading: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
    marginBottom: 32,
    textAlign: 'center',
  },
  description: {
    fontSize: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  descriptionLong: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 16,
  },
  illustrationContainer: {
    marginBottom: 32,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#6B5FD8',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    width: 32,
    backgroundColor: '#6B5FD8',
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
  skipButton: {
    alignItems: 'center',
  },
  skipText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

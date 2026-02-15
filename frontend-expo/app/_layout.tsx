import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/hooks/useAuth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading keeps the correct route on web refresh.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Light-only theme matching the web app's white background
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthScreen = segments[0] === 'login';

    if (!user && !inAuthScreen) {
      // Not logged in and not on login page → redirect to login
      router.replace('/login');
    } else if (user && inAuthScreen) {
      // Logged in but still on login page → redirect to tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  // Keep the Stack always mounted so URL-based routing is preserved on web refresh.
  // Overlay a loading spinner on top while auth state is being determined.
  return (
    <ThemeProvider value={LightTheme}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="appointment/[id]" />
          <Stack.Screen name="appointment-error/[id]" />
          <Stack.Screen name="appointment-metadata" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>

        {/* Full-screen loading overlay – keeps the navigator mounted underneath */}
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fff',
              zIndex: 999,
            }}
          >
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

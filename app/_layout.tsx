import { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useCallStore } from '../store/callStore';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { PostCallModal } from '../components/ui/PostCallModal';
import { startCallDetection } from '../services/callDetectionService';
import { leadsService } from '../services/leadsService';
import { theme } from '../constants/theme';

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    background: theme.colors.background,
    surface: theme.colors.surface,
    error: theme.colors.error,
    outline: theme.colors.outline,
    onPrimary: theme.colors.onPrimary,
    onSecondary: theme.colors.onSecondary,
    onSurface: theme.colors.onSurface,
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

// Normalize phone numbers to digits only for comparison
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0+/, '');
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { isAuthenticated, checkAuth, logout } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { pendingCall, setIncomingCall, setIncomingNumber, showModal } = useCallStore();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = useRef<number | null>(null);
  const stopCallDetectionRef = useRef<(() => void) | null>(null);

  // ─── Call detection (incoming calls) ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    startCallDetection(async (event, rawNumber) => {
      if (event === 'Incoming' && rawNumber) {
        // Try to match the caller number against existing leads
        setIncomingNumber(rawNumber);

        try {
          const { leads } = await leadsService.getAll({ search: rawNumber, limit: 5 });
          const callerNumber = normalizePhone(rawNumber);
          const matched = leads.find(
            (l) => l.phone && normalizePhone(l.phone) === callerNumber
          );

          if (matched) {
            setIncomingCall({
              leadId: matched.id,
              leadName: matched.name,
              leadPhone: rawNumber,
            });

            // Fire a local notification so the user sees who is calling
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `📞 Incoming call — ${matched.name}`,
                body: `Lead calling from ${rawNumber}`,
                data: { lead_id: matched.id },
                sound: true,
              },
              trigger: null,
            });
          }
        } catch (err) {
          console.warn('Lead lookup for caller failed:', err);
        }
      }

      // When the call disconnects, show the post-call popup (if we have a context)
      if (event === 'Disconnected') {
        const call = useCallStore.getState().pendingCall;
        if (call) {
          showModal();
        }
      }
    }).then((stop) => {
      stopCallDetectionRef.current = stop;
    });

    return () => {
      stopCallDetectionRef.current?.();
      stopCallDetectionRef.current = null;
    };
  }, [isAuthenticated]);

  // ─── AppState watcher (outgoing call fallback + iOS) ────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (prev === 'active' && nextState === 'background') {
        backgroundedAtRef.current = Date.now();
      }

      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        const bgTime = backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        // Outgoing call: pendingCall already set when the user tapped the phone icon
        // iOS incoming: CTCallCenter fires while in foreground only, so this handles
        //               the case where the user returned after an iOS call
        if (pendingCall && bgTime && Date.now() - bgTime > 5000) {
          showModal();
        }
      }
    });
    return () => subscription.remove();
  }, [pendingCall, showModal]);

  // ─── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function runCheckAuth() {
      setIsCheckingAuth(true);
      try {
        await checkAuth();
      } catch (error) {
        console.error('Network or session check failed on launch:', error);
        try {
          await logout();
        } catch (logoutError) {
          console.error('Logout failed after failed auth check:', logoutError);
        }
        useAuthStore.setState({ isAuthenticated: false });
      } finally {
        setIsCheckingAuth(false);
      }
    }
    runCheckAuth();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  // ─── Push notification listeners ────────────────────────────────────────────
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      addNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.lead_id) router.push(`/lead/${data.lead_id}`);
      if (data?.estimate_id) router.push(`/estimate/${data.estimate_id}`);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={styles.splashContainer}>
        <MaterialCommunityIcons name="forest" size={48} color={theme.colors.primary} style={styles.splashIcon} />
        <Text style={styles.splashTitle}>ForestCRM</Text>
        <Text style={styles.splashSubtitle}>Securing your workstation...</Text>
        <View style={styles.splashSpinnerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <>
      {children}
      <PostCallModal />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    async function checkForUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log('OTA update check skipped in development:', e);
      }
    }
    checkForUpdate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <AuthGuard>
              <OfflineBanner />
              <Stack screenOptions={{ headerShown: false }} />
            </AuthGuard>
          </ErrorBoundary>
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.margin,
  },
  splashIcon: {
    marginBottom: theme.spacing.gapSm,
  },
  splashTitle: {
    ...theme.typography.headlineXl,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  splashSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    opacity: 0.8,
    marginBottom: theme.spacing.gapLg,
    textAlign: 'center',
  },
  splashSpinnerContainer: {
    marginTop: theme.spacing.gapSm,
  },
});

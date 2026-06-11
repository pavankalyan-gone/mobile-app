import { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, AppState, AppStateStatus, LogBox, TouchableOpacity } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useCallStore, isPendingCallFresh } from '../store/callStore';
import { useCallLogStore } from '../store/callLogStore';
import { initOutbox } from '../utils/outbox';
import { getBiometricLockEnabled, authenticateForUnlock } from '../utils/appLock';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { PostCallModal } from '../components/ui/PostCallModal';
import { IncomingCallBanner } from '../components/ui/IncomingCallBanner';
import { startCallDetection } from '../services/callDetectionService';
import { leadsService } from '../services/leadsService';
import { notificationService } from '../services/notificationService';
import { theme, isDarkMode } from '../constants/theme';

const paperBase = isDarkMode ? MD3DarkTheme : MD3LightTheme;
const paperTheme = {
  ...paperBase,
  colors: {
    ...paperBase.colors,
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [locked, setLocked] = useState(false);
  const { isAuthenticated, checkAuth, logout } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = useRef<number | null>(null);

  // ─── Call detection (incoming calls) ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // startCallDetection resolves asynchronously (permission prompt). Track
    // cancellation so a fast unmount can never leak a live native detector.
    let cancelled = false;
    let stopDetection: (() => void) | null = null;

    // The lead lookup for an incoming number races against the call ending
    // (short ring, slow network). Track the active lookup generation and
    // whether the call ended mid-lookup so a late result can't raise a banner
    // for a finished call or leave a pendingCall that gets misattributed.
    let lookupGen = 0;
    let endedDuringLookup: 'Disconnected' | 'Missed' | null = null;

    startCallDetection(async (event, rawNumber) => {
      const callStore = useCallStore.getState();

      if (event === 'Incoming' && rawNumber) {
        const gen = ++lookupGen;
        endedDuringLookup = null;
        try {
          // Multi-variant lookup so formatting differences can't hide a client
          const matched = await leadsService.findByPhone(rawNumber);
          if (gen !== lookupGen) return; // a newer call superseded this lookup

          if (!matched) {
            // An unrelated call superseded whatever was pending — don't let a
            // stale outgoing call get attributed to this conversation.
            callStore.clearPendingCall();
            return;
          }

          callStore.setIncomingCall({
            leadId: matched.id,
            leadName: matched.name,
            leadPhone: rawNumber,
          });

          if (endedDuringLookup) {
            // The call already ended while we were matching the number —
            // skip the banner and go straight to the follow-up popup.
            const ended = endedDuringLookup;
            const lateCall = useCallStore.getState().pendingCall;
            if (lateCall) {
              useCallLogStore.getState().addEntry({
                leadId: lateCall.leadId,
                leadName: lateCall.leadName,
                leadPhone: lateCall.leadPhone,
                direction: lateCall.direction,
                at: lateCall.startedAt,
                durationMin: 0,
                missed: ended === 'Missed',
                noteSaved: false,
              });
            }
            useCallStore.getState().showModal();
            if (AppState.currentState !== 'active') {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: ended === 'Missed'
                    ? `📵 Missed call — ${matched.name}`
                    : `📝 Log your call with ${matched.name}`,
                  body: ended === 'Missed'
                    ? 'Tap to follow up with this lead'
                    : 'Tap to add notes or set a follow-up reminder',
                  data: { lead_id: matched.id },
                  sound: true,
                },
                trigger: null,
              });
            }
            return;
          }

          // Still ringing: the banner is up; a local notification covers the
          // user being outside the app.
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `📞 Incoming call — ${matched.name}`,
              body: `Lead calling from ${rawNumber}`,
              data: { lead_id: matched.id },
              sound: true,
            },
            trigger: null,
          });
        } catch (err) {
          if (__DEV__) console.warn('Lead lookup for caller failed:', err);
        }
      }

      // Call ended (answered → Disconnected, unanswered → Missed): always pop
      // the follow-up modal — it overlays whichever screen the user is on.
      if (event === 'Disconnected' || event === 'Missed') {
        endedDuringLookup = event;
        const store = useCallStore.getState();
        const call = store.pendingCall;
        store.hideBanner();

        if (isPendingCallFresh(call)) {
          useCallLogStore.getState().addEntry({
            leadId: call.leadId,
            leadName: call.leadName,
            leadPhone: call.leadPhone,
            direction: call.direction,
            at: call.startedAt,
            durationMin: Math.max(0, Math.round((Date.now() - call.startedAt) / 60000)),
            missed: event === 'Missed',
            noteSaved: false,
          });
          store.showModal();

          // The user is usually still outside the app right after a call —
          // a notification brings them back to the already-open popup.
          if (AppState.currentState !== 'active') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: event === 'Missed'
                  ? `📵 Missed call — ${call.leadName}`
                  : `📝 Log your call with ${call.leadName}`,
                body: event === 'Missed'
                  ? 'Tap to follow up with this lead'
                  : 'Tap to add notes or set a follow-up reminder',
                data: { lead_id: call.leadId },
                sound: true,
              },
              trigger: null,
            });
          }
        } else if (call) {
          store.clearPendingCall();
        }
      }
    }).then((stop) => {
      if (cancelled) stop(); // resolved after cleanup — dispose immediately
      else stopDetection = stop;
    });

    return () => {
      cancelled = true;
      stopDetection?.();
      stopDetection = null;
    };
  }, [isAuthenticated]);

  // ─── Biometric app lock (cold start only, opt-in from Profile) ─────────────
  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      if (!(await getBiometricLockEnabled()) || cancelled) return;
      setLocked(true);
      const ok = await authenticateForUnlock();
      if (!cancelled && ok) setLocked(false);
    })();
    return () => {
      cancelled = true;
    };
    // run once per session, after the auth check settles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingAuth]);

  const handleUnlockRetry = async () => {
    const ok = await authenticateForUnlock();
    if (ok) setLocked(false);
  };

  // ─── Offline outbox (queued notes/reminders sync when back online) ─────────
  useEffect(() => {
    if (!isAuthenticated) return;
    return initOutbox();
  }, [isAuthenticated]);

  // ─── AppState watcher (outgoing call fallback + iOS) ────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // iOS never jumps straight to 'background' — it passes through 'inactive'
      // (and a call over a foregrounded app may only ever reach 'inactive'),
      // so record the departure on the first transition away from active.
      if (prev === 'active' && (nextState === 'inactive' || nextState === 'background')) {
        backgroundedAtRef.current = Date.now();
      }

      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        const bgTime = backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        // Outgoing call: pendingCall already set when the user tapped the phone icon
        // iOS incoming: CTCallCenter fires while in foreground only, so this handles
        //               the case where the user returned after an iOS call
        const callStore = useCallStore.getState();
        const call = callStore.pendingCall;
        if (call && bgTime && Date.now() - bgTime > 5000) {
          if (isPendingCallFresh(call)) callStore.showModal();
          else callStore.clearPendingCall(); // expired — never prompt for an old call
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // ─── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function runCheckAuth() {
      setIsCheckingAuth(true);
      try {
        await checkAuth();
        if (useAuthStore.getState().isAuthenticated) {
          notificationService.registerDeviceToken();
        }
      } catch (error) {
        if (__DEV__) console.warn('Session check failed on launch:', error);
        try {
          await logout();
        } catch {
          // best-effort cleanup
        }
        useAuthStore.setState({ isAuthenticated: false });
      } finally {
        setIsCheckingAuth(false);
      }
    }
    runCheckAuth();
  }, []);

  useEffect(() => {
    if (isCheckingAuth) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isCheckingAuth]);

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

  if (locked) {
    return (
      <View style={styles.splashContainer}>
        <MaterialCommunityIcons name="lock-outline" size={48} color={theme.colors.primary} style={styles.splashIcon} />
        <Text style={styles.splashTitle}>ForestCRM</Text>
        <Text style={styles.splashSubtitle}>Unlock to continue</Text>
        <TouchableOpacity
          style={styles.unlockBtn}
          onPress={handleUnlockRetry}
          accessibilityRole="button"
          accessibilityLabel="Unlock"
        >
          <MaterialCommunityIcons name="fingerprint" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.unlockBtnText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {children}
      <IncomingCallBanner />
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
      } catch {
        // OTA updates unavailable (e.g. development) — ignore
      }
    }
    checkForUpdate();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <ErrorBoundary>
            <AuthGuard>
              <OfflineBanner />
              <Stack screenOptions={{ headerShown: false }} />
            </AuthGuard>
          </ErrorBoundary>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
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
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.xl,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: theme.spacing.gapSm,
  },
  unlockBtnText: {
    ...theme.typography.labelLg,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
});

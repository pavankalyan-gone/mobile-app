import { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';

import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { OfflineBanner } from '../components/ui/OfflineBanner';

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
  const { isAuthenticated, checkAuth, logout } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

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

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      addNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.lead_id) router.push(`/lead/${data.lead_id}`);
      if (data?.estimate_id) router.push(`/estimate/${data.estimate_id}`);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashTitle}>Perfex CRM</Text>
        <ActivityIndicator size="large" color="#6750A4" style={styles.splashSpinner} />
      </View>
    );
  }

  return <>{children}</>;
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
      <PaperProvider>
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  splashSpinner: {
    marginTop: 10,
  },
});

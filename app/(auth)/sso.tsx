import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, Text } from 'react-native-paper';
import * as Linking from 'expo-linking';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function SSOScreen() {
  const router = useRouter();
  const { ssoUrl } = useLocalSearchParams<{ ssoUrl: string }>();
  const [loading, setLoading] = useState(true);
  const { handleSSOLogin } = useAuthStore();

  const handleClose = () => {
    router.back();
  };

  const handleRedirect = async (url: string) => {
    // Intercept callback and process the login
    try {
      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token || parsed.queryParams?.access_token;
      if (token) {
        // Go back to login screen first to prevent UI transition issues
        router.back();
        // Trigger handleSSOLogin with the extracted JWT token
        await handleSSOLogin(token as string);
      }
    } catch (err: any) {
      if (__DEV__) console.warn('SSO callback processing failed:', err);
      useAuthStore.setState({ error: err.message || 'Failed to authenticate via SSO' });
      router.back();
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    if (url.startsWith('perfex-mobile://') || url.includes('/auth/callback')) {
      handleRedirect(url);
      return false; // Stop loading page in WebView
    }
    return true; // Continue loading
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    if (url.startsWith('perfex-mobile://') || url.includes('/auth/callback')) {
      handleRedirect(url);
    }
  };

  if (!ssoUrl) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid SSO URL configuration.</Text>
        <Appbar.BackAction onPress={handleClose} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header style={styles.header} statusBarHeight={0}>
        <Appbar.BackAction onPress={handleClose} color={theme.colors.primary} />
        <Appbar.Content
          title="SSO Secure Login"
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <View style={styles.container}>
        <WebView
          source={{ uri: ssoUrl }}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={styles.webview}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading secure portal...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    elevation: 0,
  },
  headerTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.gapMd,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    ...theme.typography.bodyLg,
    color: theme.colors.errorRed,
    marginBottom: theme.spacing.gapMd,
  },
});

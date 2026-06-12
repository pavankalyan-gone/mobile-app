import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [webError, setWebError] = useState<string | null>(null);
  const { handleSSOLogin } = useAuthStore();

  const handleClose = () => {
    router.back();
  };

  const extractTokenFromUrl = (url: string): string | null => {
    try {
      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token || parsed.queryParams?.access_token;
      if (token && typeof token === 'string' && token.startsWith('eyJ')) {
        return token;
      }
    } catch {}

    // Fallback regex matching for safety
    const match = url.match(/[?&](?:token|access_token)=(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+)/);
    return match ? match[1] : null;
  };

  const handleRedirectWithToken = async (token: string) => {
    console.log('JWT Token successfully extracted, initiating SSO login...');
    try {
      // Go back to login screen first to prevent UI transition issues
      router.back();
      // Trigger handleSSOLogin with the extracted JWT token
      await handleSSOLogin(token);
    } catch (err: any) {
      if (__DEV__) console.warn('SSO callback processing failed:', err);
      useAuthStore.setState({ error: err.message || 'Failed to authenticate via SSO' });
      router.back();
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log('WebView requesting load:', url);
    
    const token = extractTokenFromUrl(url);
    if (token) {
      handleRedirectWithToken(token);
      return false; // Stop loading page in WebView
    }

    if (url.startsWith('perfex-mobile://') || url.startsWith('perfex-mobile:')) {
      return false; // Stop loading page in WebView
    }
    return true; // Continue loading
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    console.log('WebView navigation state change:', url, 'Loading:', navState.loading);
    
    const token = extractTokenFromUrl(url);
    if (token) {
      handleRedirectWithToken(token);
    }
  };

  const handleLoadError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView load error:', nativeEvent);
    setWebError(`Load error: ${nativeEvent.description} (${nativeEvent.code})`);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView HTTP error:', nativeEvent);
    setWebError(`HTTP error: ${nativeEvent.statusCode} - ${nativeEvent.description}`);
    setLoading(false);
  };

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
        {!ssoUrl ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Invalid SSO URL configuration.</Text>
          </View>
        ) : webError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{webError}</Text>
          </View>
        ) : (
          <>
            <WebView
              source={{ uri: ssoUrl }}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadStart={() => {
                console.log('WebView onLoadStart for:', ssoUrl);
                setLoading(true);
                setWebError(null);
              }}
              onLoadEnd={() => {
                console.log('WebView onLoadEnd');
                setLoading(false);
              }}
              onError={handleLoadError}
              onHttpError={handleHttpError}
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
          </>
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

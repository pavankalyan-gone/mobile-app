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

  const handleTokenReceived = async (token: string) => {
    console.log('JWT Token successfully extracted, saving silently...');
    try {
      const { jwtDecode } = require('jwt-decode');
      const decoded = jwtDecode(token) as any;
      const SecureStore = require('expo-secure-store');
      
      if (decoded.aud && decoded.aud.includes('estimator')) {
        await SecureStore.setItemAsync('estimator_auth_token', token);
        console.log('[SSO] Saved Estimator specific token');
      } else if (decoded.aud && decoded.aud.includes('crm')) {
        await SecureStore.setItemAsync('perfex_auth_token', token);
        console.log('[SSO] Saved CRM specific token');
      }
      await SecureStore.setItemAsync('sso_access_token', token);
    } catch (err: any) {
      console.warn('Silent token save failed', err);
    }
  };

  const finalizeLogin = async () => {
    try {
      const SecureStore = require('expo-secure-store');
      const primaryToken = await SecureStore.getItemAsync('perfex_auth_token') || await SecureStore.getItemAsync('sso_access_token');
      if (primaryToken) {
        await handleSSOLogin(primaryToken);
      } else {
        throw new Error("No tokens were successfully saved during SSO.");
      }
    } catch (err: any) {
      useAuthStore.setState({ error: err.message || 'Failed to finalize SSO login' });
    }
    router.back();
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log('WebView requesting load:', url);
    
    const token = extractTokenFromUrl(url);
    if (token) {
      handleTokenReceived(token);
    }

    if (
      url.startsWith('perfex-mobile://') || 
      url.startsWith('perfex-mobile:') ||
      url.includes('/admin/')
    ) {
      console.log('Final SSO redirect reached (or admin dashboard), closing WebView.');
      finalizeLogin();
      return false; // Stop loading page in WebView
    }
    return true; // Continue loading
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    console.log('WebView navigation state change:', url, 'Loading:', navState.loading);
    
    const token = extractTokenFromUrl(url);
    if (token) {
      handleTokenReceived(token);
    }

    if (
      url.startsWith('perfex-mobile://') || 
      url.startsWith('perfex-mobile:') ||
      url.includes('/admin/')
    ) {
      console.log('Final SSO redirect reached (nav state), closing WebView.');
      finalizeLogin();
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

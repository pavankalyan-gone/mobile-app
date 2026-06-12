import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PERFEX_API_URL } from '../../constants/config';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { login, handleSSOLogin, isLoading, error, clearError } = useAuthStore();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setValidationError(null);
    clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setValidationError(null);
    clearError();
  };

  const handleLogin = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setValidationError('Please enter your email and password.');
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    setValidationError(null);
    login(trimmedEmail, password);
  };

  const handleSSOPress = async () => {
    setIsSSOLoading(true);
    clearError();
    try {
      const response = await fetch(`${PERFEX_API_URL}/info`);
      const data = await response.json();

      if (!data?.data?.auth?.sso_enabled) {
        throw new Error('SSO is not enabled on the server.');
      }

      // Use nexus_login_url if available to authenticate across both CRM and Estimator platforms
      const ssoUrl = data.data.auth.nexus_login_url || data.data.auth.sso_url;
      if (!ssoUrl) {
        throw new Error('SSO login URL is not configured on the server.');
      }

      router.push({
        pathname: '/(auth)/sso',
        params: { ssoUrl },
      });
    } catch (err: any) {
      useAuthStore.setState({ error: err.message || 'Failed to authenticate via SSO' });
    } finally {
      setIsSSOLoading(false);
    }
  };

  const displayError = validationError || error;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Login',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary, fontWeight: '700' },
          // Login is the navigation root — no back button
          headerLeft: () => null,
        }}
      />
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        bounces={false}
      >
        {/* Bundled brand mark instead of a hot-linked remote image */}
        <View style={styles.logoCircle}>
          {/* fixed light accent circle needs a fixed dark icon color */}
          <MaterialCommunityIcons name="forest" size={64} color="#1b300f" />
        </View>
        <Text style={styles.appName}>ForestCRM</Text>
        <Text style={styles.tagline}>Sign in to manage your leads and estimates</Text>

        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            mode="outlined"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            theme={{ colors: { background: theme.colors.surface } }}
            left={<TextInput.Icon icon="email-outline" color={theme.colors.textMuted} />}
          />

          <TextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={!showPassword}
            autoComplete="password"
            mode="outlined"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            theme={{ colors: { background: theme.colors.surface } }}
            left={<TextInput.Icon icon="lock-outline" color={theme.colors.textMuted} />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                color={theme.colors.textMuted}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              />
            }
          />

          {displayError !== null && (
            <HelperText type="error" visible style={styles.errorText}>
              {displayError}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading || isSSOLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Sign in
          </Button>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.socialButton}
            activeOpacity={0.8}
            onPress={handleSSOPress}
            disabled={isLoading || isSSOLoading}
            accessibilityRole="button"
            accessibilityLabel="Login with SSO"
          >
            <MaterialCommunityIcons name="shield-account-outline" size={20} color={theme.colors.primary} style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>
              {isSSOLoading ? 'Connecting...' : 'Login with SSO'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.margin,
    paddingTop: 80,
    paddingBottom: 20,
  },
  logoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#cfebba',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.gapMd,
  },
  appName: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.gapLg,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: theme.spacing.gapMd,
  },
  inputOutline: {
    borderRadius: theme.roundness.xl,
    borderColor: theme.colors.borderSubtle,
    borderWidth: 1,
  },
  errorText: {
    color: theme.colors.errorRed,
    paddingHorizontal: 0,
    marginBottom: theme.spacing.gapSm,
  },
  button: {
    borderRadius: theme.roundness.xl,
    marginTop: theme.spacing.gapSm,
    height: 56,
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    height: 56,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.gapLg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
  },
  dividerText: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    paddingHorizontal: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: theme.roundness.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
  },
});

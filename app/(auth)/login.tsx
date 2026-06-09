import { useState } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const { login, isLoading, error, clearError } = useAuthStore();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    clearError();
  };

  const handleLogin = () => {
    // Temporarily bypass real authentication for testing
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 1, name: 'Test User', email: email || 'test@example.com', role: 'admin' }
    });
    router.replace('/(tabs)');
  };

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
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                }
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
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
        {/* Minimalist Illustration */}
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI73TYbWJHtUSjVLXE_WhI4bLDaugrGVJyURGAljnQRM_HH5yL_Q4l-R-23UyAwe61mPD-nKBHZLIkh35SFfUFlbfp2Sia0wFNPDXQfrTatYOV1bkp830QFpIAgJgnomV6TVkiicUXzPVtnWobzlx03hRBpA8wELmDAMe2ZpOscGwxTMAawh4IZrHe-auMCu3A1N9IWOuMqgYT210Ujh0RXcVUHGL-ruUZe9vi1rYKraK3yyxDu6OulhM0CehdGH9cuH5qQ644raY' }}
          style={styles.illustration}
        />

        {/* Input Fields */}
        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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
              />
            }
          />

          {error !== null && (
            <HelperText type="error" visible={error !== null} style={styles.errorText}>
              {error}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Sign in
          </Button>

          {/* Social login divider or custom actions */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
            <MaterialCommunityIcons name="google" size={20} color={theme.colors.primary} style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
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
  backButton: {
    marginLeft: 8,
  },
  illustration: {
    width: 240,
    height: 160,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: theme.spacing.gapLg,
  },
  title: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.gapSm,
  },
  subtitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.textMuted,
    textAlign: 'center',
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


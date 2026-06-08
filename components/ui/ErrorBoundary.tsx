import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in boundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Large Error Icon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="alert" size={48} color={theme.colors.error} />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              Something went wrong
            </Text>

            {/* Muted Error Message */}
            <Text style={styles.subtitle}>
              An unexpected error occurred in the component tree. Our forest rangers have been notified.
            </Text>

            {/* Primary Action Button */}
            <Button
              mode="contained"
              onPress={this.handleRetry}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              icon={() => <MaterialCommunityIcons name="refresh" size={20} color="#ffffff" />}
            >
              Try again
            </Button>

            {/* Secondary Action */}
            <Button
              mode="text"
              onPress={this.handleRetry}
              textColor={theme.colors.secondary}
              style={styles.secondaryButton}
            >
              Go back to Dashboard
            </Button>
          </View>

          {/* Error Code Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              SYSTEM CODE: ERR_RENDER_004
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.margin,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: 32,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    width: '100%',
    maxWidth: 340,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffdad6', // error-container color
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.gapLg,
  },
  title: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.gapSm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.gapLg,
    lineHeight: 20,
  },
  button: {
    borderRadius: theme.roundness.full,
    height: 56,
    justifyContent: 'center',
    width: '100%',
  },
  buttonContent: {
    height: 56,
  },
  secondaryButton: {
    marginTop: theme.spacing.gapSm,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.labelSm,
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    opacity: 0.6,
  },
});

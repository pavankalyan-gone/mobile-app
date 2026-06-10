import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  buttonText?: string;
  onPressButton?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  buttonText,
  onPressButton,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icon wrapper */}
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name={icon} size={40} color={theme.colors.outline} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Action Button */}
        {buttonText && onPressButton && (
          <Button
            mode="outlined"
            onPress={onPressButton}
            style={styles.button}
            textColor={theme.colors.primary}
            theme={{ colors: { outline: theme.colors.primary } }}
          >
            {buttonText}
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: theme.spacing.gapMd,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.xl, // 24px
    paddingVertical: 40,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceContainerLow, // #f4f4f2
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    borderRadius: theme.roundness.full,
    marginTop: 8,
    borderWidth: 1,
  },
});

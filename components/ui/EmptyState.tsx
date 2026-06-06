import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar } from 'react-native-paper';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Avatar.Icon
        icon={icon}
        color="#BDBDBD"
        size={72}
        style={styles.icon}
      />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  icon: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  title: {
    color: '#49454F',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#79747E',
    textAlign: 'center',
  },
});

import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Avatar } from 'react-native-paper';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { theme } from '../constants/theme';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign out?', 'You will need to log in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const rows: { icon: string; label: string; value?: string }[] = [
    { icon: 'email-outline', label: 'Email', value: user?.email },
    { icon: 'badge-account-horizontal-outline', label: 'Role', value: user?.role },
    { icon: 'phone-outline', label: 'Mobile', value: user?.mobile_number },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profile',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary, fontWeight: '700' },
        }}
      />

      <View style={styles.headerBlock}>
        <Avatar.Text
          size={72}
          label={initialsOf(user?.name || '')}
          style={{ backgroundColor: theme.colors.primary }}
          color={theme.colors.onPrimary}
        />
        <Text style={styles.name}>{user?.name || 'User'}</Text>
      </View>

      <View style={styles.card}>
        {rows.filter((r) => r.value).map((row) => (
          <View key={row.label} style={styles.row}>
            <MaterialCommunityIcons name={row.icon as any} size={20} color={theme.colors.primary} />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          </View>
        ))}
        {rows.every((r) => !r.value) && (
          <Text style={styles.emptyText}>No profile details available from the CRM.</Text>
        )}
      </View>

      <Button
        mode="outlined"
        icon="logout"
        onPress={handleLogout}
        textColor={theme.colors.error}
        style={styles.logoutBtn}
      >
        Sign out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.margin,
    paddingBottom: theme.spacing.gapLg,
  },
  headerBlock: {
    alignItems: 'center',
    paddingVertical: theme.spacing.gapMd,
  },
  name: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: '700',
    marginTop: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.paddingX,
    marginTop: theme.spacing.gapSm,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
  },
  rowValue: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
  },
  logoutBtn: {
    marginTop: theme.spacing.gapMd,
    borderColor: theme.colors.error,
  },
});

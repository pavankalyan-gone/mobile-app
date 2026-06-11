import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallLogStore, CallLogEntry } from '../store/callLogStore';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDateTime } from '../utils/format';
import { theme } from '../constants/theme';

function describeCall(entry: CallLogEntry): string {
  if (entry.missed) return 'Missed call';
  const direction = entry.direction === 'incoming' ? 'Incoming' : 'Outgoing';
  return entry.durationMin > 0 ? `${direction} · ~${entry.durationMin} min` : direction;
}

export default function CallHistoryScreen() {
  const router = useRouter();
  const { entries, clear } = useCallLogStore();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Call History',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary, fontWeight: '700' },
        }}
      />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/lead/${item.leadId}`)}
            accessibilityRole="button"
            accessibilityLabel={`Call with ${item.leadName}`}
          >
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name={item.missed ? 'phone-missed' : item.direction === 'incoming' ? 'phone-incoming' : 'phone-outgoing'}
                size={20}
                color={item.missed ? theme.colors.error : theme.colors.primary}
              />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.leadName}</Text>
              <Text style={styles.cardText}>{describeCall(item)}</Text>
              <Text style={styles.cardDate}>{formatDateTime(new Date(item.at).toISOString())}</Text>
            </View>
            {item.noteSaved && (
              <MaterialCommunityIcons name="note-check-outline" size={20} color={theme.colors.secondary} />
            )}
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="phone-log-outline"
            title="No calls yet"
            subtitle="Detected calls with your leads will be logged here"
          />
        }
        ListFooterComponent={
          entries.length > 0 ? (
            <Button mode="text" onPress={clear} textColor={theme.colors.textMuted} style={styles.clearBtn}>
              Clear history
            </Button>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingVertical: theme.spacing.gapSm,
    paddingBottom: theme.spacing.gapLg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.paddingX,
    marginHorizontal: theme.spacing.margin,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  cardText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  cardDate: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  clearBtn: {
    marginTop: theme.spacing.gapSm,
  },
});

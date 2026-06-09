import { useState } from 'react';
import { FlatList, View, StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Chip, Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useEstimates } from '../../hooks/useEstimates';
import { EstimateCard } from '../../components/estimates/EstimateCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { theme } from '../../constants/theme';

const FILTER_CHIPS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Declined', value: 'declined' },
  { label: 'Expired', value: 'expired' },
  { label: 'Approved', value: 'approved' },
  { label: 'Waiting Approval', value: 'waiting_approval' },
];

export default function EstimatesScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isFetching, refetch } = useEstimates({
    status: statusFilter || undefined,
  });

  const totalCount = data?.total;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Estimates</Text>
          <Text style={styles.headerSubtitle}>{totalCount ?? 0} Total Entries</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="bell-outline" size={24} iconColor={theme.colors.primary} onPress={() => {}} style={styles.headerIconBtn} />
          <IconButton icon="calendar-month" size={24} iconColor={theme.colors.primary} onPress={() => router.push('/(tabs)/calendar')} style={styles.headerIconBtn} />
        </View>
      </View>

      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {FILTER_CHIPS.map((chip) => {
            const isSelected = statusFilter === chip.value;
            return (
              <Chip
                key={chip.value || 'all'}
                mode={isSelected ? 'flat' : 'outlined'}
                selected={isSelected}
                onPress={() => setStatusFilter(chip.value)}
                style={isSelected ? styles.chipSelected : styles.chipUnselected}
                textStyle={isSelected ? styles.chipTextSelected : styles.chipTextUnselected}
                showSelectedOverlay={false}
              >
                {chip.label}
              </Chip>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EstimateCard
              estimate={item}
              onPress={() => router.push(`/estimate/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="file-remove-outline"
              title="No estimates found"
              subtitle="Try a different status filter"
              buttonText={statusFilter !== '' ? "Clear filter" : undefined}
              onPressButton={statusFilter !== '' ? () => setStatusFilter('') : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.paddingX,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: theme.colors.background,
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    ...theme.typography.headlineXlMobile,
    fontSize: 25,
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...theme.typography.labelSm,
    fontSize: 9,
    color: 'rgba(68, 72, 63, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 0,
  },
  headerIconBtn: {
    margin: 0,
  },
  chipsContainer: {
    marginBottom: theme.spacing.gapSm,
  },
  chipsScroll: {
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: theme.spacing.gapSm,
    gap: theme.spacing.gapSm,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.md,
    borderColor: theme.colors.primary,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.md,
  },
  chipTextSelected: {
    ...theme.typography.labelSm,
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  chipTextUnselected: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: theme.spacing.gapLg,
  },
  headerCount: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginRight: theme.spacing.paddingX,
  },
});


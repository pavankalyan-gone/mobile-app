import { useState, useCallback } from 'react';
import { FlatList, View, StyleSheet, RefreshControl, ScrollView, ListRenderItemInfo } from 'react-native';
import { ActivityIndicator, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useEstimates } from '../../hooks/useEstimates';
import { Estimate } from '../../services/estimatesService';
import { EstimateCard } from '../../components/estimates/EstimateCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
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
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useEstimates({
    status: statusFilter || undefined,
  });

  const totalCount = data?.pages[0]?.total;
  const allEstimates = data?.pages.flatMap((page) => page.data) ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderEstimate = useCallback(
    ({ item }: ListRenderItemInfo<Estimate>) => (
      <EstimateCard estimate={item} onPress={() => router.push(`/estimate/${item.id}`)} />
    ),
    [router]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="Estimates" subtitle={`${totalCount ?? 0} Total Entries`} />

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
          data={allEstimates}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEstimate}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.footerLoader} />
            ) : null
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="wifi-off"
                title="Couldn't load estimates"
                subtitle="Check your connection and try again"
                buttonText="Retry"
                onPressButton={() => refetch()}
              />
            ) : (
              <EmptyState
                icon="file-remove-outline"
                title="No estimates found"
                subtitle="Try a different status filter"
                buttonText={statusFilter !== '' ? 'Clear filter' : undefined}
                onPressButton={statusFilter !== '' ? () => setStatusFilter('') : undefined}
              />
            )
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
  footerLoader: {
    marginVertical: theme.spacing.gapLg,
  },
  listContent: {
    paddingBottom: theme.spacing.gapLg,
  },
});

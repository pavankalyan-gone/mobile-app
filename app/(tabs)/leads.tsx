import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { ActivityIndicator, Chip, Text, Portal, Modal, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useLeads, useLeadStatuses } from '../../hooks/useLeads';
import { Lead } from '../../services/leadsService';
import { LeadCard } from '../../components/leads/LeadCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { AppFab } from '../../components/ui/AppFab';
import { theme } from '../../constants/theme';

export default function LeadsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [assignedFilter, setAssignedFilter] = useState<number | 'me' | ''>('');
  const [sourceFilter, setSourceFilter] = useState<number | ''>('');
  const [sortFilter, setSortFilter] = useState<'dateadded' | 'name' | 'company' | ''>('');
  const [refreshing, setRefreshing] = useState(false);

  // 400ms debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Query leads with debounced search and filters. '' means default
  // (dateadded desc, applied server-side), so no sort params are sent.
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useLeads({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    assigned: assignedFilter || undefined,
    source: sourceFilter || undefined,
    sort: sortFilter || undefined,
    order: sortFilter ? 'asc' : undefined,
    limit: 20,
  });

  const { data: statuses } = useLeadStatuses();

  const hasActiveFilters =
    search !== '' || statusFilter !== '' || assignedFilter !== '' || sourceFilter !== '' || sortFilter !== '';

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setAssignedFilter('');
    setSourceFilter('');
    setSortFilter('');
  };

  // Only show the pull-to-refresh spinner for user-initiated refreshes,
  // not background refetches.
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderLead = useCallback(
    ({ item }: ListRenderItemInfo<Lead>) => (
      <LeadCard lead={item} onPress={() => router.push(`/lead/${item.id}`)} />
    ),
    [router]
  );

  const totalCount = data?.pages[0]?.total;
  const allLeads = data?.pages.flatMap((page) => page.leads) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Leads"
        subtitle={`${totalCount ?? 0} Total Entries`}
        actions={
          <IconButton
            icon="tune"
            size={24}
            iconColor={theme.colors.primary}
            onPress={() => setFilterModalVisible(true)}
            style={styles.headerIconBtn}
            accessibilityLabel="Filters"
          />
        }
      />

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.outline} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or status..."
          placeholderTextColor="rgba(116, 121, 110, 0.4)"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search leads"
        />
      </View>

      {/* Clear Filters Shortcut — covers every active filter, not just search/status */}
      {hasActiveFilters && (
        <View style={styles.clearContainer}>
          <TouchableOpacity onPress={handleClearFilters} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.clearText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leads List or First-load Loading Indicator */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlashList
          data={allLeads}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLead}
          // @ts-ignore - TS types for FlashList are missing estimatedItemSize in this project's setup
          estimatedItemSize={120}
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
                title="Couldn't load leads"
                subtitle="Check your connection and try again"
                buttonText="Retry"
                onPressButton={() => refetch()}
              />
            ) : (
              <EmptyState
                icon="account-search"
                title="No leads found"
                subtitle="Try a different search or filter"
                buttonText={hasActiveFilters ? 'Clear filters' : undefined}
                onPressButton={hasActiveFilters ? handleClearFilters : undefined}
              />
            )
          }
        />
      )}

      <AppFab icon="account-plus" onPress={() => router.push('/lead/new')} accessibilityLabel="Add lead" />

      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Advanced Filters</Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={() => setFilterModalVisible(false)}
              style={styles.modalCloseBtn}
              accessibilityLabel="Close filters"
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}>

            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              <Chip selected={statusFilter === ''} onPress={() => setStatusFilter('')} style={styles.filterOptionChip}>All</Chip>
              {statuses?.map((status) => (
                <Chip
                  key={status.id}
                  selected={statusFilter === status.id}
                  onPress={() => setStatusFilter(status.id)}
                  style={styles.filterOptionChip}
                >
                  {status.name}
                </Chip>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Assigned To</Text>
            <View style={styles.filterOptions}>
              <Chip selected={assignedFilter === ''} onPress={() => setAssignedFilter('')} style={styles.filterOptionChip}>All</Chip>
              <Chip selected={assignedFilter === 'me'} onPress={() => setAssignedFilter('me')} style={styles.filterOptionChip}>Me</Chip>
              <Chip selected={assignedFilter === 0} onPress={() => setAssignedFilter(0)} style={styles.filterOptionChip}>Unassigned</Chip>
            </View>

            <Text style={styles.filterSectionTitle}>Source</Text>
            <View style={styles.filterOptions}>
              <Chip selected={sourceFilter === ''} onPress={() => setSourceFilter('')} style={styles.filterOptionChip}>All</Chip>
              <Chip selected={sourceFilter === 1} onPress={() => setSourceFilter(1)} style={styles.filterOptionChip}>Organic</Chip>
              <Chip selected={sourceFilter === 2} onPress={() => setSourceFilter(2)} style={styles.filterOptionChip}>Referral</Chip>
              <Chip selected={sourceFilter === 3} onPress={() => setSourceFilter(3)} style={styles.filterOptionChip}>Ads</Chip>
            </View>

            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              <Chip selected={sortFilter === ''} onPress={() => setSortFilter('')} style={styles.filterOptionChip}>Newest First</Chip>
              <Chip selected={sortFilter === 'name'} onPress={() => setSortFilter('name')} style={styles.filterOptionChip}>Name</Chip>
              <Chip selected={sortFilter === 'company'} onPress={() => setSortFilter('company')} style={styles.filterOptionChip}>Company</Chip>
            </View>

            <Button mode="contained" onPress={() => setFilterModalVisible(false)} style={styles.applyFiltersBtn} buttonColor={theme.colors.primary} textColor={theme.colors.onPrimary}>
              Apply Filters
            </Button>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerIconBtn: {
    margin: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.paddingX,
    marginBottom: 24,
    backgroundColor: '#ffffff', // surfaceContainerLowest
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: 'rgba(196, 200, 188, 0.3)', // outlineVariant/30
    paddingHorizontal: 24,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    height: '100%',
  },
  footerLoader: {
    marginVertical: theme.spacing.gapLg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.margin,
    margin: theme.spacing.margin,
    borderRadius: theme.roundness.xl,
    maxHeight: '80%', // Ensure modal doesn't stretch beyond screen and allows scrolling
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    paddingBottom: theme.spacing.gapSm,
    marginBottom: theme.spacing.gapSm,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
  },
  modalCloseBtn: {
    margin: 0,
  },
  filterSectionTitle: {
    ...theme.typography.labelLg,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.gapSm,
    marginBottom: theme.spacing.gapSm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.gapMd,
  },
  filterOptionChip: {
    backgroundColor: theme.colors.surface,
  },
  applyFiltersBtn: {
    marginTop: theme.spacing.gapSm,
    borderRadius: theme.roundness.xl,
  },
  clearContainer: {
    alignItems: 'flex-end',
    marginRight: theme.spacing.margin,
    marginBottom: theme.spacing.gapSm,
  },
  clearText: {
    color: theme.colors.primary,
    ...theme.typography.labelSm,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: theme.spacing.gapLg,
  },
});

import { useState, useEffect } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { ActivityIndicator, Chip, Text, Portal, Modal, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useLeads, useLeadStatuses } from '../../hooks/useLeads';
import { LeadCard } from '../../components/leads/LeadCard';
import { EmptyState } from '../../components/ui/EmptyState';
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

  // 400ms debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Query leads with debounced search and status filter
  const { data, isLoading, isFetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useLeads({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    assigned: assignedFilter || undefined,
    source: sourceFilter || undefined,
    sort: sortFilter || undefined,
    limit: 20,
  });

  const { data: statuses } = useLeadStatuses();

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setAssignedFilter('');
    setSourceFilter('');
    setSortFilter('');
  };

  const totalCount = data?.pages[0]?.total;
  const allLeads = data?.pages.flatMap(page => page.leads) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Leads</Text>
          <Text style={styles.headerSubtitle}>{totalCount ?? 0} Total Entries</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="calendar-month" size={24} iconColor={theme.colors.primary} onPress={() => router.push('/(tabs)/calendar')} style={styles.headerIconBtn} />
          <IconButton icon="tune" size={24} iconColor={theme.colors.primary} onPress={() => setFilterModalVisible(true)} style={styles.headerIconBtn} />
          <IconButton icon="dots-vertical" size={24} iconColor={theme.colors.primary} style={styles.headerIconBtn} />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.outline} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or status..."
          placeholderTextColor="rgba(116, 121, 110, 0.4)"
          value={search}
          onChangeText={setSearch}
        />
      </View>


      {/* Clear Filters Shortcut */}
      {(search !== '' || statusFilter !== '') && (
        <View style={styles.clearContainer}>
          <TouchableOpacity onPress={handleClearFilters} activeOpacity={0.7}>
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
          estimatedItemSize={150}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() => router.push(`/lead/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={refetch} tintColor={theme.colors.primary} />
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
            <EmptyState
              icon="account-search"
              title="No leads found"
              subtitle="Try a different search or filter"
              buttonText={(search !== '' || statusFilter !== '' || assignedFilter !== '') ? "Clear filters" : undefined}
              onPressButton={(search !== '' || statusFilter !== '' || assignedFilter !== '') ? handleClearFilters : undefined}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => {}}>
        <MaterialCommunityIcons name="account-plus" size={24} color={theme.colors.onPrimary} />
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Advanced Filters</Text>
          
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
            <Chip selected={sortFilter === ''} onPress={() => setSortFilter('')} style={styles.filterOptionChip}>Date Added</Chip>
            <Chip selected={sortFilter === 'name'} onPress={() => setSortFilter('name')} style={styles.filterOptionChip}>Name</Chip>
            <Chip selected={sortFilter === 'company'} onPress={() => setSortFilter('company')} style={styles.filterOptionChip}>Company</Chip>
          </View>

          <Button mode="contained" onPress={() => setFilterModalVisible(false)} style={styles.applyFiltersBtn} buttonColor={theme.colors.primary} textColor={theme.colors.onPrimary}>
            Apply Filters
          </Button>
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
    color: 'rgba(68, 72, 63, 0.6)', // onSurfaceVariant/60
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  footerLoader: {
    marginVertical: theme.spacing.gapLg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.margin,
    margin: theme.spacing.margin,
    borderRadius: theme.roundness.xl,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    marginBottom: theme.spacing.gapMd,
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
  chipsContainer: {
    marginBottom: theme.spacing.gapSm,
  },
  chipsScroll: {
    paddingHorizontal: theme.spacing.margin,
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
  headerCount: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginRight: theme.spacing.paddingX,
  },
});


import { useState, useEffect } from 'react';
import { FlatList, View, StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { Searchbar, ActivityIndicator, Chip, Text } from 'react-native-paper';
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

  // 400ms debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Query leads with debounced search and status filter
  const { data, isLoading, isFetching, refetch } = useLeads({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    page: 1,
  });

  const { data: statuses } = useLeadStatuses();

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  const totalCount = data?.total;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Leads',
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary },
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerRight: totalCount !== undefined ? () => (
            <Text style={styles.headerCount}>{totalCount} leads</Text>
          ) : undefined,
        }}
      />

      <Searchbar
        placeholder="Search by name or email…"
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        placeholderTextColor={theme.colors.textMuted}
        iconColor={theme.colors.textMuted}
        inputStyle={{ color: theme.colors.onSurface }}
      />

      {/* Status Filter Chips Row */}
      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <Chip
            key="all"
            mode={statusFilter === '' ? 'flat' : 'outlined'}
            selected={statusFilter === ''}
            onPress={() => setStatusFilter('')}
            style={statusFilter === '' ? styles.chipSelected : styles.chipUnselected}
            textStyle={statusFilter === '' ? styles.chipTextSelected : styles.chipTextUnselected}
            showSelectedOverlay={false}
          >
            All
          </Chip>
          {statuses?.map((status) => {
            const isSelected = statusFilter === status.id;
            return (
              <Chip
                key={status.id}
                mode={isSelected ? 'flat' : 'outlined'}
                selected={isSelected}
                onPress={() => setStatusFilter(status.id)}
                style={isSelected ? styles.chipSelected : styles.chipUnselected}
                textStyle={isSelected ? styles.chipTextSelected : styles.chipTextUnselected}
                showSelectedOverlay={false}
              >
                {status.name}
              </Chip>
            );
          })}
        </ScrollView>
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
        <FlatList
          data={data?.leads ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() => router.push(`/lead/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={theme.colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="account-search"
              title="No leads found"
              subtitle="Try a different search or filter"
              buttonText={(search !== '' || statusFilter !== '') ? "Clear filters" : undefined}
              onPressButton={(search !== '' || statusFilter !== '') ? handleClearFilters : undefined}
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
  searchbar: {
    margin: theme.spacing.margin,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
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


import { useState, useEffect } from 'react';
import { FlatList, View, StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { Searchbar, ActivityIndicator, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useLeads, useLeadStatuses } from '../../hooks/useLeads';
import { LeadCard } from '../../components/leads/LeadCard';
import { EmptyState } from '../../components/ui/EmptyState';

export default function LeadsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
          headerTitle: 'Leads',
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
          >
            All
          </Chip>
          {statuses?.map((status) => {
            const isSelected = statusFilter === String(status.id);
            return (
              <Chip
                key={status.id}
                mode={isSelected ? 'flat' : 'outlined'}
                selected={isSelected}
                onPress={() => setStatusFilter(String(status.id))}
                style={isSelected ? styles.chipSelected : styles.chipUnselected}
                textStyle={isSelected ? styles.chipTextSelected : styles.chipTextUnselected}
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
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leads List or First-load Loading Indicator */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6750A4" />
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
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="account-search"
              title="No leads found"
              subtitle="Try a different search or filter"
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
    backgroundColor: '#f8f8f8',
  },
  searchbar: {
    margin: 16,
    borderRadius: 8,
  },
  chipsContainer: {
    marginBottom: 8,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipSelected: {
    backgroundColor: '#6750A4',
  },
  chipUnselected: {
    borderColor: '#e0e0e0',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextUnselected: {
    color: '#666666',
  },
  clearContainer: {
    alignItems: 'flex-end',
    marginRight: 16,
    marginBottom: 4,
  },
  clearText: {
    color: '#6750A4',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  headerCount: {
    fontSize: 14,
    color: '#888888',
    marginRight: 16,
  },
});

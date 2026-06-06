import { useState } from 'react';
import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import { SegmentedButtons, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useEstimates } from '../../hooks/useEstimates';
import { EstimateCard } from '../../components/estimates/EstimateCard';
import { EmptyState } from '../../components/ui/EmptyState';

const FILTER_BUTTONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
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
      <Stack.Screen
        options={{
          headerTitle: 'Estimates',
          headerRight: totalCount !== undefined ? () => (
            <Text style={styles.headerCount}>{totalCount} estimates</Text>
          ) : undefined,
        }}
      />

      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={FILTER_BUTTONS}
        style={styles.segmentedButtons}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6750A4" />
        </View>
      ) : (
        <FlatList
          data={data?.estimates ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EstimateCard
              estimate={item}
              onPress={() => router.push(`/estimate/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="file-remove-outline"
              title="No estimates found"
              subtitle="Try a different status filter"
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
  segmentedButtons: {
    margin: 16,
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

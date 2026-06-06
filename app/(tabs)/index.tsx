import { ScrollView, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useLeads } from '../../hooks/useLeads';
import { useEstimates } from '../../hooks/useEstimates';
import { LeadCard } from '../../components/leads/LeadCard';
import { EstimateCard } from '../../components/estimates/EstimateCard';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const leadsQuery = useLeads({ page: 1 });
  const estimatesQuery = useEstimates({ status: 'sent' });

  const isLoading = leadsQuery.isLoading && estimatesQuery.isLoading;

  const totalLeads = leadsQuery.data?.total;
  const isLeadsLoading = leadsQuery.isLoading;

  const pendingEstimates = estimatesQuery.data?.total;
  const isEstimatesLoading = estimatesQuery.isLoading;

  const leads = leadsQuery.data?.leads?.slice(0, 5) || [];
  const estimates = estimatesQuery.data?.estimates?.slice(0, 5) || [];

  const formatTodayDate = () => {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const dayNum = String(date.getDate()).padStart(2, '0');
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <MaterialCommunityIcons name="logout" size={24} color="#6750A4" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name}</Text>
          <Text style={styles.date}>{formatTodayDate()}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6750A4" />
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.statsRow}>
              {/* Card 1 — Total Leads */}
              <View style={[styles.card, { backgroundColor: '#EDE9FE' }]}>
                {isLeadsLoading ? (
                  <ActivityIndicator size="small" color="#6750A4" />
                ) : (
                  <Text style={styles.cardValue}>{totalLeads ?? 0}</Text>
                )}
                <Text style={styles.cardLabel}>Total Leads</Text>
              </View>

              {/* Card 2 — Pending Estimates */}
              <View style={[styles.card, { backgroundColor: '#E0F2FE' }]}>
                {isEstimatesLoading ? (
                  <ActivityIndicator size="small" color="#6750A4" />
                ) : (
                  <Text style={styles.cardValue}>{pendingEstimates ?? 0}</Text>
                )}
                <Text style={styles.cardLabel}>Pending Est.</Text>
              </View>

              {/* Card 3 — Due Today */}
              <View style={[styles.card, { backgroundColor: '#ffffff' }]}>
                <Text style={styles.cardValue}>0</Text>
                <Text style={styles.cardLabel}>Due Today</Text>
              </View>
            </View>

            {/* Recent Leads Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Leads</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/leads')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {leads.length === 0 ? (
                <Text style={styles.emptyText}>No leads yet</Text>
              ) : (
                leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onPress={() => router.push(`/lead/${lead.id}`)}
                  />
                ))
              )}
            </View>

            {/* Recent Estimates Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Estimates</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/estimates')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {estimates.length === 0 ? (
                <Text style={styles.emptyText}>No estimates yet</Text>
              ) : (
                estimates.map((estimate) => (
                  <EstimateCard
                    key={estimate.id}
                    estimate={estimate}
                    onPress={() => router.push(`/estimate/${estimate.id}`)}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  logoutButton: {
    marginRight: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 90,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  cardLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 14,
    color: '#6750A4',
    fontWeight: '600',
  },
  emptyText: {
    marginHorizontal: 16,
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});

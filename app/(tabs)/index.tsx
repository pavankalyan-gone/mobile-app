import { ScrollView, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useLeads } from '../../hooks/useLeads';
import { useEstimates } from '../../hooks/useEstimates';
import { useReminders } from '../../hooks/useReminders';
import { LeadCard } from '../../components/leads/LeadCard';
import { EstimateCard } from '../../components/estimates/EstimateCard';
import { theme } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const leadsQuery = useLeads({ page: 1 });
  const estimatesQuery = useEstimates();
  const remindersQuery = useReminders();

  const isLoading = leadsQuery.isLoading && estimatesQuery.isLoading;

  const today = new Date().toDateString();
  const dueTodayCount = remindersQuery.data?.filter(
    (r) => new Date(r.due_date).toDateString() === today && !r.is_read
  ).length ?? 0;

  const totalLeads = leadsQuery.data?.total;
  const isLeadsLoading = leadsQuery.isLoading;

  const pendingEstimates = estimatesQuery.data?.total;
  const isEstimatesLoading = estimatesQuery.isLoading;

  const leads = leadsQuery.data?.leads?.slice(0, 5) || [];
  const estimates = estimatesQuery.data?.data?.slice(0, 5) || [];

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
          headerShown: true,
          title: 'Dashboard',
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary },
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <MaterialCommunityIcons name="logout" size={24} color={theme.colors.primary} />
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
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            {/* Summary Cards Row */}
            <View style={styles.statsRow}>
              {/* Card 1 — Total Leads */}
              <View style={[styles.card, { backgroundColor: '#cfebba' }]}>
                {isLeadsLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={styles.cardValue}>{totalLeads ?? 0}</Text>
                )}
                <Text style={styles.cardLabel}>Total Leads</Text>
              </View>

              {/* Card 2 — Total Estimates */}
              <View style={[styles.card, { backgroundColor: '#b2f746' }]}>
                {isEstimatesLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={styles.cardValue}>{pendingEstimates ?? 0}</Text>
                )}
                <Text style={styles.cardLabel}>Estimates</Text>
              </View>

              {/* Card 3 — Due Today */}
              <View style={[styles.card, { backgroundColor: '#ffd8ed' }]}>
                {remindersQuery.isLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={styles.cardValue}>{dueTodayCount}</Text>
                )}
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
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.gapLg,
  },
  logoutButton: {
    marginRight: theme.spacing.paddingX,
  },
  header: {
    paddingHorizontal: theme.spacing.margin,
    paddingTop: theme.spacing.gapMd,
    paddingBottom: theme.spacing.gapSm,
  },
  greeting: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  date: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
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
    gap: theme.spacing.gapSm,
    marginHorizontal: theme.spacing.margin,
    marginVertical: theme.spacing.gapMd,
  },
  card: {
    borderRadius: theme.roundness.xl,
    padding: theme.spacing.paddingX,
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 96,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  cardValue: {
    ...theme.typography.headlineLg,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cardLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.primary,
    opacity: 0.8,
    marginTop: theme.spacing.gapSm,
  },
  section: {
    marginBottom: theme.spacing.gapLg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: theme.spacing.margin,
    marginBottom: theme.spacing.gapSm,
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  seeAll: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
  },
  emptyText: {
    marginHorizontal: theme.spacing.margin,
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.gapSm,
  },
});


import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useRecentLeadsStore } from '../../store/recentLeadsStore';
import { useLeads } from '../../hooks/useLeads';
import { useEstimates } from '../../hooks/useEstimates';
import { useReminders } from '../../hooks/useReminders';
import { LeadCard } from '../../components/leads/LeadCard';
import { EstimateCard } from '../../components/estimates/EstimateCard';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { toDateKey } from '../../utils/format';
import { theme } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const recentLeads = useRecentLeadsStore((s) => s.entries);
  const [refreshing, setRefreshing] = useState(false);

  const leadsQuery = useLeads({ limit: 5 });
  const estimatesQuery = useEstimates();
  const remindersQuery = useReminders();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([leadsQuery.refetch(), estimatesQuery.refetch(), remindersQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [leadsQuery.refetch, estimatesQuery.refetch, remindersQuery.refetch]);

  const todayKey = toDateKey(new Date().toISOString());
  const dueTodayCount = Array.isArray(remindersQuery.data)
    ? remindersQuery.data.filter((r) => toDateKey(r.due_date) === todayKey && !r.is_read).length
    : 0;

  const totalLeads = leadsQuery.data?.pages?.[0]?.total;
  const totalEstimates = estimatesQuery.data?.pages?.[0]?.total;
  const loadedLeads = leadsQuery.data?.pages?.flatMap((p) => p.leads) || [];
  // No total from the API: show the loaded count with "+" if there are more
  const leadsCountLabel = totalLeads != null
    ? String(totalLeads)
    : `${loadedLeads.length}${leadsQuery.hasNextPage ? '+' : ''}`;

  const leads = loadedLeads.slice(0, 5);
  const estimates = estimatesQuery.data?.pages?.flatMap((p) => p.data)?.slice(0, 5) || [];

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
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={`Hello, ${user?.name ?? 'there'}`}
        subtitle={formatTodayDate()}
        actions={
          <>
            <IconButton
              icon="phone-log-outline"
              size={24}
              iconColor={theme.colors.primary}
              onPress={() => router.push('/calls')}
              style={styles.headerIconBtn}
              accessibilityLabel="Call history"
            />
            <IconButton
              icon="account-circle-outline"
              size={24}
              iconColor={theme.colors.primary}
              onPress={() => router.push('/profile')}
              style={styles.headerIconBtn}
              accessibilityLabel="Profile"
            />
          </>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Summary Cards Row */}
        <View style={styles.statsRow}>
          {/* Card 1 — Total Leads */}
          <View style={[styles.card, { backgroundColor: '#cfebba' }]}>
            {leadsQuery.isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.cardValue}>{leadsCountLabel}</Text>
            )}
            <Text style={styles.cardLabel}>Total Leads</Text>
          </View>

          {/* Card 2 — Total Estimates */}
          <View style={[styles.card, { backgroundColor: '#b2f746' }]}>
            {estimatesQuery.isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.cardValue}>{totalEstimates ?? 0}</Text>
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

        {/* Recently Viewed — quick jump back to leads you just had open */}
        {recentLeads.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentChipsRow}
            >
              {recentLeads.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.recentChip}
                  onPress={() => router.push(`/lead/${r.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${r.name}`}
                >
                  <Text style={styles.recentChipName} numberOfLines={1}>{r.name}</Text>
                  {!!r.company && (
                    <Text style={styles.recentChipCompany} numberOfLines={1}>{r.company}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Leads Section — each section owns its loading/error state */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Leads</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/leads')} accessibilityRole="button">
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {leadsQuery.isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.sectionLoader} />
          ) : leadsQuery.isError ? (
            <Text style={styles.emptyText}>Couldn't load leads — pull down to retry</Text>
          ) : leads.length === 0 ? (
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
            <TouchableOpacity onPress={() => router.push('/(tabs)/estimates')} accessibilityRole="button">
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {estimatesQuery.isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.sectionLoader} />
          ) : estimatesQuery.isError ? (
            <Text style={styles.emptyText}>Couldn't load estimates — pull down to retry</Text>
          ) : estimates.length === 0 ? (
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
  headerIconBtn: {
    margin: 0,
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
    elevation: 1,
  },
  cardValue: {
    ...theme.typography.headlineLg,
    fontWeight: '700',
    // The stat cards keep fixed light accent backgrounds in both schemes,
    // so their text must stay dark (theme.colors.primary is light in dark mode)
    color: '#1b300f',
  },
  cardLabel: {
    ...theme.typography.labelSm,
    color: '#1b300f',
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
  recentChipsRow: {
    paddingHorizontal: theme.spacing.margin,
    gap: 10,
  },
  recentChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 180,
  },
  recentChipName: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  recentChipCompany: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  sectionLoader: {
    paddingVertical: theme.spacing.gapMd,
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

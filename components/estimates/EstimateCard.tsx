import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { Estimate } from '../../services/estimatesService';
import { getStatusStyles } from '../../utils/statusColors';
import { formatDate, formatINR } from '../../utils/format';
import { theme } from '../../constants/theme';

interface Props {
  estimate: Estimate;
  onPress: () => void;
}

export const EstimateCard = React.memo(function EstimateCard({ estimate, onPress }: Props) {
  const statusStyles = getStatusStyles(estimate.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Estimate ${estimate.estimate_number}, status ${estimate.status}`}
    >
      {/* Header Row: Estimate Number & Client Info on Left, Status on Right */}
      <View style={styles.row}>
        <View style={styles.clientInfo}>
          <Text style={styles.number}>{estimate.estimate_number}</Text>
          <Text style={styles.clientName}>{estimate.lead_name}</Text>
        </View>
        <Chip
          style={[styles.chip, { backgroundColor: statusStyles.backgroundColor }]}
          textStyle={[styles.chipText, { color: statusStyles.color }]}
          compact
        >
          {estimate.status}
        </Chip>
      </View>

      {/* Bottom Row: Valid Until Date on Left, Total inside container on Right */}
      <View style={styles.bottomRow}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>VALID UNTIL</Text>
          <Text style={styles.dateText}>{formatDate(estimate.valid_until)}</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{formatINR(estimate.total)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: 24,
    marginHorizontal: theme.spacing.margin,
    marginVertical: theme.spacing.gapSm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInfo: {
    flex: 1,
    marginRight: 8,
  },
  number: {
    ...theme.typography.headlineMd,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  clientName: {
    ...theme.typography.labelLg,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  chip: {
    borderRadius: theme.roundness.full,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  chipText: {
    ...theme.typography.labelSm,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  dateContainer: {
    flex: 1,
  },
  dateLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '600',
  },
  dateText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.roundness.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  totalText: {
    ...theme.typography.labelLg,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
});

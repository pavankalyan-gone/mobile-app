import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Lead } from '../../services/leadsService';
import { getStatusStyles } from '../../utils/statusColors';
import { formatShortDate } from '../../utils/format';
import { theme } from '../../constants/theme';

interface Props {
  lead: Lead;
  onPress: () => void;
}

export const LeadCard = React.memo(function LeadCard({ lead, onPress }: Props) {
  const statusStyles = getStatusStyles(lead.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Lead ${lead.name}, status ${lead.status}`}
    >
      <View style={styles.topSection}>
        <View style={styles.nameEmailContainer}>
          <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
          <Text style={styles.email} numberOfLines={1}>{lead.email || 'No Email'}</Text>
        </View>
        <Chip
          style={[styles.chip, { backgroundColor: statusStyles.backgroundColor }]}
          textStyle={[styles.chipText, { color: statusStyles.color }]}
          compact
        >
          {lead.status}
        </Chip>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.phoneContainer}>
          <MaterialCommunityIcons name="phone-outline" size={18} color={theme.colors.outline} />
          <Text style={styles.phoneText} numberOfLines={1}>{lead.phone || 'No Phone'}</Text>
        </View>
        <Text style={styles.dateText}>{formatShortDate(lead.date_added)}</Text>
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
    borderColor: 'rgba(196, 200, 188, 0.2)', // outlineVariant/20
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nameEmailContainer: {
    flex: 1,
    marginRight: 16,
    gap: 4,
  },
  name: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  email: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    opacity: 0.7,
  },
  chip: {
    borderRadius: theme.roundness.full,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    ...theme.typography.labelSm,
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196, 200, 188, 0.1)', // outlineVariant/10
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
  },
  dateText: {
    ...theme.typography.labelSm,
    color: theme.colors.outline,
    opacity: 0.6,
  },
});

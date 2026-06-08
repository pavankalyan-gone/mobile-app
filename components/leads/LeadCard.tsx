import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Lead } from '../../services/leadsService';
import { theme } from '../../constants/theme';

interface Props {
  lead: Lead;
  onPress: () => void;
}

const getStatusStyles = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('new') || normalized.includes('custom') || normalized.includes('accept') || normalized.includes('approv')) {
    return { backgroundColor: '#cfebba', textColor: '#1b300f' }; // Light green tint
  }
  if (normalized.includes('contact') || normalized.includes('remind') || normalized.includes('pend')) {
    return { backgroundColor: '#ffd8ed', textColor: '#290a21' }; // Pink tint
  }
  if (normalized.includes('lost') || normalized.includes('junk') || normalized.includes('declin') || normalized.includes('expir') || normalized.includes('fail')) {
    return { backgroundColor: '#ffdad6', textColor: '#ba1a1a' }; // Red tint
  }
  return { backgroundColor: '#eeeeec', textColor: '#44483f' }; // Gray tint
};

export function LeadCard({ lead, onPress }: Props) {
  const statusStyles = getStatusStyles(lead.status);
  const formattedDate = new Date(lead.date_added).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.9}>
      {/* Header Row */}
      <View style={styles.row}>
        <Text style={styles.name}>{lead.name}</Text>
        <Chip
          style={[styles.chip, { backgroundColor: statusStyles.backgroundColor }]}
          textStyle={[styles.chipText, { color: statusStyles.textColor }]}
          compact
        >
          {lead.status}
        </Chip>
      </View>

      {/* Meta Content */}
      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="email-outline" size={16} color={theme.colors.textMuted} style={styles.metaIcon} />
          <Text style={styles.metaText} numberOfLines={1}>{lead.email || 'No Email'}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="phone-outline" size={16} color={theme.colors.textMuted} style={styles.metaIcon} />
          <Text style={styles.metaText} numberOfLines={1}>{lead.phone || 'No Phone'}</Text>
        </View>
      </View>

      {/* Card Footer Divider Row */}
      <View style={styles.footerRow}>
        <Text style={styles.dateText}>Added {formattedDate}</Text>
        <View style={styles.arrowButton}>
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.xl, // 24px
    padding: 20,
    marginHorizontal: theme.spacing.margin,
    marginVertical: theme.spacing.gapSm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: theme.spacing.gapMd,
  },
  name: { 
    ...theme.typography.labelLg,
    color: theme.colors.primary,
    fontWeight: '700', 
    flex: 1, 
    marginRight: 8 
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
    fontWeight: '600',
  },
  metaContainer: {
    gap: 8,
    marginBottom: theme.spacing.gapMd,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 8,
  },
  metaText: { 
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant, 
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceContainer,
    paddingTop: 12,
  },
  dateText: { 
    ...theme.typography.labelSm,
    color: theme.colors.textMuted, 
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

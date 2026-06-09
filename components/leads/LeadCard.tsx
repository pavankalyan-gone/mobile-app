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
      <View style={styles.topSection}>
        <View style={styles.nameEmailContainer}>
          <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
          <Text style={styles.email} numberOfLines={1}>{lead.email || 'No Email'}</Text>
        </View>
        <Chip
          style={[styles.chip, { backgroundColor: statusStyles.backgroundColor }]}
          textStyle={[styles.chipText, { color: statusStyles.textColor }]}
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
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg, // 16px equivalent
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

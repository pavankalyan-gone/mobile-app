import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { Lead } from '../../services/leadsService';

interface Props {
  lead: Lead;
  onPress: () => void;
}

const getStatusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('new')) return '#e3f2fd';
  if (normalized.includes('contact')) return '#fff8e1';
  if (normalized.includes('qualif') || normalized.includes('custom') || normalized.includes('accept')) return '#e8f5e9';
  if (normalized.includes('lost') || normalized.includes('junk') || normalized.includes('declin') || normalized.includes('expir')) return '#ffebee';
  return '#f5f5f5';
};

export function LeadCard({ lead, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text variant="titleSmall" style={styles.name}>{lead.name}</Text>
        <Chip
          style={{ backgroundColor: getStatusColor(lead.status) }}
          textStyle={{ fontSize: 11 }}
        >
          {lead.status}
        </Chip>
      </View>
      <Text variant="bodySmall" style={styles.meta}>{lead.email || 'No Email'}</Text>
      <Text variant="bodySmall" style={styles.meta}>{lead.phone || 'No Phone'}</Text>
      <Text variant="bodySmall" style={styles.date}>
        Added {new Date(lead.date_added).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontWeight: '600', flex: 1, marginRight: 8 },
  meta: { color: '#666', marginTop: 2 },
  date: { color: '#999', marginTop: 8, fontSize: 11 },
});

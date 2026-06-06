import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { Estimate } from '../../services/estimatesService';

interface Props {
  estimate: Estimate;
  onPress: () => void;
}

const statusColor: Record<string, string> = {
  draft: '#e0e0e0',
  sent: '#bbdefb',
  accepted: '#c8e6c9',
  declined: '#ffcdd2',
  expired: '#ffe0b2',
};

const statusTextColor: Record<string, string> = {
  draft: '#424242',
  sent: '#0d47a1',
  accepted: '#1b5e20',
  declined: '#b71c1c',
  expired: '#e65100',
};

export function EstimateCard({ estimate, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text variant="titleSmall" style={styles.number}>{estimate.estimate_number}</Text>
        <Chip 
          style={{ backgroundColor: statusColor[estimate.status] || '#e0e0e0', height: 26, justifyContent: 'center' }} 
          textStyle={{ fontSize: 10, color: statusTextColor[estimate.status] || '#424242', fontWeight: 'bold' }}
        >
          {estimate.status.toUpperCase()}
        </Chip>
      </View>
      <Text variant="bodyMedium" style={styles.meta}>Lead: {estimate.lead_name}</Text>
      <View style={styles.row} >
        <Text variant="bodySmall" style={styles.date}>
          Valid until {new Date(estimate.valid_until).toLocaleDateString()}
        </Text>
        <Text variant="titleMedium" style={styles.total}>
          ₹{estimate.total.toLocaleString()}
        </Text>
      </View>
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
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  number: { fontWeight: '700', color: '#1a1a1a' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: '#4a4a4a' },
  date: { color: '#757575' },
  total: { fontWeight: '700', color: '#6200ee' },
});

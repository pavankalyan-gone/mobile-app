import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Linking, TouchableOpacity, Alert } from 'react-native';
import { Text, Chip, Button, Divider, DataTable, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEstimate, useUpdateEstimateStatus } from '../../hooks/useEstimates';
import { EmptyState } from '../../components/ui/EmptyState';

export default function EstimateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: estimate, isLoading } = useEstimate(Number(id));
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateEstimateStatus();

  const [displayStatus, setDisplayStatus] = useState<string>('');

  useEffect(() => {
    if (estimate) {
      setDisplayStatus(estimate.status);
    }
  }, [estimate]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6750A4" />
      </View>
    );
  }

  if (!estimate) {
    return (
      <EmptyState
        icon="file-alert-outline"
        title="Estimate not found"
        subtitle="Estimate details could not be loaded or estimate does not exist"
      />
    );
  }

  const getStatusStyles = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'draft') return { backgroundColor: '#F3F4F6', color: '#374151' };
    if (normalized === 'sent') return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
    if (normalized === 'accepted') return { backgroundColor: '#D1FAE5', color: '#065F46' };
    if (normalized === 'declined') return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    if (normalized === 'expired') return { backgroundColor: '#FEF3C7', color: '#92400E' };
    
    return { backgroundColor: '#F3F4F6', color: '#374151' };
  };

  const statusStyles = getStatusStyles(displayStatus);

  const handleAccept = () => {
    const prevStatus = displayStatus;
    setDisplayStatus('accepted');
    updateStatus(
      { id: estimate.id, status: 'accepted' },
      {
        onError: (err) => {
          console.error('Failed to accept estimate:', err);
          setDisplayStatus(prevStatus);
        },
      }
    );
  };

  const handleDeclineConfirm = () => {
    const prevStatus = displayStatus;
    setDisplayStatus('declined');
    updateStatus(
      { id: estimate.id, status: 'declined' },
      {
        onError: (err) => {
          console.error('Failed to decline estimate:', err);
          setDisplayStatus(prevStatus);
        },
      }
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Mark as Declined?',
      'Are you sure you want to mark this estimate as declined? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: handleDeclineConfirm },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNum = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayNum} ${monthName} ${year}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: 'Estimate Details' }} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {estimate.estimate_number}
        </Text>
        <Chip
          style={{ backgroundColor: statusStyles.backgroundColor, height: 32, justifyContent: 'center' }}
          textStyle={{ color: statusStyles.color, fontWeight: 'bold' }}
        >
          {displayStatus.toUpperCase()}
        </Chip>
      </View>
      <Divider />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => router.push(`/lead/${estimate.lead_id}`)}
        >
          <MaterialCommunityIcons name="account-outline" size={22} color="#757575" />
          <Text style={styles.infoTextLink}>{estimate.lead_name}</Text>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-outline" size={22} color="#757575" />
          <Text style={styles.infoText}>Valid until {formatDate(estimate.valid_until)}</Text>
        </View>
      </View>
      <Divider />

      {/* Line Items Table Section */}
      <View style={styles.tableSection}>
        <Text style={styles.sectionTitle}>Line Items</Text>
        <DataTable style={styles.table}>
          <DataTable.Header>
            <DataTable.Title style={styles.colDesc}>Description</DataTable.Title>
            <DataTable.Title numeric style={styles.colQty}>Qty</DataTable.Title>
            <DataTable.Title numeric style={styles.colRate}>Rate</DataTable.Title>
            <DataTable.Title numeric style={styles.colAmt}>Amount</DataTable.Title>
          </DataTable.Header>

          {estimate.items && estimate.items.map((item) => (
            <DataTable.Row key={item.id}>
              <DataTable.Cell style={styles.colDesc}>
                <Text style={styles.cellText}>{item.description}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.colQty}>
                <Text style={styles.cellText}>{item.qty}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.colRate}>
                <Text style={styles.cellText}>₹{item.rate.toLocaleString('en-IN')}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.colAmt}>
                <Text style={styles.cellText}>₹{item.amount.toLocaleString('en-IN')}</Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Row style={styles.summaryRow}>
            <DataTable.Cell style={{ flex: 4 }}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric style={{ flex: 1.5 }}>
              <Text style={styles.subtotalValue}>₹{estimate.subtotal.toLocaleString('en-IN')}</Text>
            </DataTable.Cell>
          </DataTable.Row>

          <DataTable.Row style={styles.summaryRow}>
            <DataTable.Cell style={{ flex: 4 }}>
              <Text style={styles.totalLabel}>Total</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric style={{ flex: 1.5 }}>
              <Text style={styles.totalValue}>₹{estimate.total.toLocaleString('en-IN')}</Text>
            </DataTable.Cell>
          </DataTable.Row>
        </DataTable>
      </View>
      <Divider />

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <View style={styles.buttonsRow}>
          {displayStatus === 'sent' && (
            <>
              <Button
                mode="contained"
                onPress={handleAccept}
                loading={isUpdating}
                disabled={isUpdating}
                style={styles.actionButton}
                contentStyle={styles.buttonContent}
              >
                Mark Accepted
              </Button>
              <Button
                mode="outlined"
                onPress={handleDecline}
                loading={isUpdating}
                disabled={isUpdating}
                textColor="#d32f2f"
                style={[styles.actionButton, styles.declineButton]}
                contentStyle={styles.buttonContent}
              >
                Mark Declined
              </Button>
            </>
          )}

          {estimate.pdf_url && (
            <Button
              mode="outlined"
              icon="file-pdf-box"
              onPress={() => Linking.openURL(estimate.pdf_url!)}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              View PDF
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  infoTextLink: {
    fontSize: 16,
    color: '#1e88e5',
    textDecorationLine: 'underline',
  },
  tableSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  table: {
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  colDesc: {
    flex: 2,
  },
  colQty: {
    flex: 0.8,
  },
  colRate: {
    flex: 1.2,
  },
  colAmt: {
    flex: 1.5,
  },
  cellText: {
    fontSize: 12,
  },
  summaryRow: {
    backgroundColor: '#fafafa',
  },
  subtotalLabel: {
    color: '#666666',
    fontSize: 14,
  },
  subtotalValue: {
    color: '#666666',
    fontSize: 14,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  actionsSection: {
    padding: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    borderRadius: 8,
    minWidth: 120,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  declineButton: {
    borderColor: '#d32f2f',
  },
});

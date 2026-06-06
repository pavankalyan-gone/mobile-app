import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, Chip, Divider, ActivityIndicator, Menu } from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLead, useLeadReminders, useUpdateLeadStatus } from '../../hooks/useLeads';
import { EmptyState } from '../../components/ui/EmptyState';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, isLoading } = useLead(Number(id));
  const { data: reminders } = useLeadReminders(Number(id));
  const updateStatusMutation = useUpdateLeadStatus();

  const [menuVisible, setMenuVisible] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  // Sync local status when lead data changes (e.g. after a mutation resolves)
  useEffect(() => {
    if (lead) {
      setLocalStatus(null);
    }
  }, [lead]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6750A4" />
      </View>
    );
  }

  if (!lead) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Lead not found"
        subtitle="Lead details could not be loaded or lead does not exist"
      />
    );
  }

  const currentStatus = localStatus || lead.status || '';

  const getStatusStyles = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'new') return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
    if (normalized === 'contacted') return { backgroundColor: '#FEF3C7', color: '#92400E' };
    if (normalized === 'qualified') return { backgroundColor: '#D1FAE5', color: '#065F46' };
    if (normalized === 'lost') return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    
    // Fallback checks
    if (normalized.includes('new')) return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
    if (normalized.includes('contact')) return { backgroundColor: '#FEF3C7', color: '#92400E' };
    if (normalized.includes('qualif')) return { backgroundColor: '#D1FAE5', color: '#065F46' };
    if (normalized.includes('lost')) return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    
    return { backgroundColor: '#F3F4F6', color: '#374151' };
  };

  const statusStyles = getStatusStyles(currentStatus);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleStatusSelect = (selectedStatus: string) => {
    closeMenu();
    setLocalStatus(selectedStatus);
    updateStatusMutation.mutate(
      { id: lead.id, status: selectedStatus },
      {
        onError: (err) => {
          console.error('Failed to update status:', err);
          setLocalStatus(null); // rollback on error
        },
      }
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

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNum = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours);
    
    return `${dayNum} ${monthName} ${year}, ${formattedHours}:${minutes} ${ampm}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Lead Details' }} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>{lead.name}</Text>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Chip
              onPress={openMenu}
              style={[styles.statusChip, { backgroundColor: statusStyles.backgroundColor }]}
              textStyle={{ color: statusStyles.color, fontWeight: '600' }}
            >
              {currentStatus.toUpperCase()}
            </Chip>
          }
        >
          <Menu.Item onPress={() => handleStatusSelect('new')} title="New" />
          <Menu.Item onPress={() => handleStatusSelect('contacted')} title="Contacted" />
          <Menu.Item onPress={() => handleStatusSelect('qualified')} title="Qualified" />
          <Menu.Item onPress={() => handleStatusSelect('lost')} title="Lost" />
        </Menu>
      </View>
      <Divider />

      {/* Contact Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Contact</Text>
        {lead.email ? (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:' + lead.email)}
          >
            <MaterialCommunityIcons name="email-outline" size={20} color="#757575" style={styles.contactIcon} />
            <Text style={styles.contactText}>{lead.email}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#bdbdbd" style={styles.contactIcon} />
            <Text style={[styles.contactText, { color: '#bdbdbd' }]}>No Email</Text>
          </View>
        )}

        {lead.phone ? (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('tel:' + lead.phone)}
          >
            <MaterialCommunityIcons name="phone-outline" size={20} color="#757575" style={styles.contactIcon} />
            <Text style={styles.contactText}>{lead.phone}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color="#bdbdbd" style={styles.contactIcon} />
            <Text style={[styles.contactText, { color: '#bdbdbd' }]}>No Phone</Text>
          </View>
        )}
      </View>
      <Divider />

      {/* Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Source</Text>
          <Text style={styles.detailValue}>{lead.source || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Assigned to</Text>
          <Text style={styles.detailValue}>{lead.assigned_to || 'Unassigned'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Added on</Text>
          <Text style={styles.detailValue}>{formatDate(lead.date_added)}</Text>
        </View>

        {lead.value !== null && lead.value !== undefined && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Value</Text>
            <Text style={styles.detailValue}>₹{lead.value.toLocaleString('en-IN')}</Text>
          </View>
        )}
      </View>
      <Divider />

      {/* Tags Section */}
      {lead.tags && lead.tags.length > 0 && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScroll}
            >
              {lead.tags.map((tag: string, index: number) => (
                <Chip
                  key={`${tag}-${index}`}
                  mode="outlined"
                  style={styles.tagChip}
                  textStyle={styles.tagChipText}
                >
                  {tag}
                </Chip>
              ))}
            </ScrollView>
          </View>
          <Divider />
        </>
      )}

      {/* Reminders Section */}
      <View style={[styles.section, { paddingBottom: 40 }]}>
        <Text style={styles.sectionLabelBold}>Reminders</Text>
        {!reminders || reminders.length === 0 ? (
          <Text style={styles.emptyReminders}>No reminders</Text>
        ) : (
          reminders.map((reminder) => {
            const bellColor = reminder.is_notified === 1 ? '#16A34A' : '#D97706';
            return (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderHeader}>
                  <MaterialCommunityIcons name="bell-outline" size={20} color={bellColor} />
                  <Text style={styles.reminderDesc}>{reminder.description}</Text>
                </View>
                <Text style={styles.reminderDate}>{formatDateTime(reminder.date)}</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    flexWrap: 'wrap',
    gap: 10,
  },
  title: {
    fontWeight: 'bold',
    flexShrink: 1,
    color: '#1a1a1a',
  },
  statusChip: {
    alignSelf: 'center',
    height: 32,
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  sectionLabelBold: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#1e88e5',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    color: '#888888',
    width: 120,
    fontSize: 15,
  },
  detailValue: {
    flex: 1,
    color: '#1a1a1a',
    fontSize: 15,
  },
  tagsScroll: {
    gap: 6,
  },
  tagChip: {
    height: 28,
    justifyContent: 'center',
    borderColor: '#e0e0e0',
  },
  tagChipText: {
    fontSize: 11,
    lineHeight: 12,
    color: '#666666',
  },
  reminderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reminderDesc: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  reminderDate: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 28,
  },
  emptyReminders: {
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
});

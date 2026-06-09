import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Chip, Divider, ActivityIndicator, Menu, Button } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useLead,
  useLeadReminders,
  useUpdateLeadStatus,
  useLeadStatuses,
  useMarkLeadLost,
  useMarkLeadJunk,
  useAddLeadNote,
} from '../../../hooks/useLeads';
import { useCallStore } from '../../../store/callStore';
import { EmptyState } from '../../../components/ui/EmptyState';
import { theme } from '../../../constants/theme';

export default function LeadDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, isLoading } = useLead(Number(id));
  const { data: reminders } = useLeadReminders(Number(id));
  const { data: statuses } = useLeadStatuses();
  const updateStatusMutation = useUpdateLeadStatus();
  const markLostMutation = useMarkLeadLost();
  const markJunkMutation = useMarkLeadJunk();
  const addNoteMutation = useAddLeadNote();
  const setOutgoingCall = useCallStore((s) => s.setOutgoingCall);

  const [menuVisible, setMenuVisible] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (lead) {
      setLocalStatus(null);
    }
  }, [lead]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
    if (normalized.includes('new') || normalized.includes('custom') || normalized.includes('accept') || normalized.includes('approv')) {
      return { backgroundColor: '#cfebba', color: '#1b300f' }; // Light forest tint
    }
    if (normalized.includes('contact') || normalized.includes('remind') || normalized.includes('pend')) {
      return { backgroundColor: '#ffd8ed', color: '#290a21' }; // Light tertiary tint
    }
    if (normalized.includes('lost') || normalized.includes('junk') || normalized.includes('declin') || normalized.includes('expir') || normalized.includes('fail')) {
      return { backgroundColor: '#ffdad6', color: '#ba1a1a' }; // Red error tint
    }
    return { backgroundColor: '#eeeeec', color: '#44483f' }; // Gray tint
  };

  const statusStyles = getStatusStyles(currentStatus);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleStatusSelect = (statusId: number, statusName: string) => {
    closeMenu();
    setLocalStatus(statusName);
    updateStatusMutation.mutate(
      { id: lead.id, status: statusId },
      {
        onError: (err) => {
          console.error('Failed to update status:', err);
          setLocalStatus(null);
        },
      }
    );
  };

  const handleMarkLost = () => {
    const isCurrentlyLost = lead.status?.toLowerCase().includes('lost');
    Alert.alert(
      isCurrentlyLost ? 'Unmark as Lost?' : 'Mark as Lost?',
      isCurrentlyLost
        ? 'Remove the lost flag from this lead?'
        : 'Mark this lead as lost?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => markLostMutation.mutate({ id: lead.id, lost: !isCurrentlyLost }),
        },
      ]
    );
  };

  const handleMarkJunk = () => {
    const isCurrentlyJunk = lead.status?.toLowerCase().includes('junk');
    Alert.alert(
      isCurrentlyJunk ? 'Unmark as Junk?' : 'Mark as Junk?',
      isCurrentlyJunk
        ? 'Remove the junk flag from this lead?'
        : 'Mark this lead as junk/spam?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: isCurrentlyJunk ? 'default' : 'destructive',
          onPress: () => markJunkMutation.mutate({ id: lead.id, junk: !isCurrentlyJunk }),
        },
      ]
    );
  };

  const handleAddNote = () => {
    const text = noteText.trim();
    if (!text) return;
    setNoteText('');
    addNoteMutation.mutate({ id: lead.id, description: text });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes} ${ampm}`;
  };

  const customFieldsWithValues = (lead.custom_fields || []).filter(
    (f) => lead.custom_field_values?.[f.slug ?? f.name]
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{lead.name}</Text>
              {(lead.title || lead.company) && (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {lead.title ? `${lead.title} ` : ''}
                  {lead.company ? `at ${lead.company}` : ''}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <Chip
                  onPress={openMenu}
                  style={[styles.statusChip, { backgroundColor: statusStyles.backgroundColor }]}
                  textStyle={{ color: statusStyles.color, fontWeight: '700' }}
                  showSelectedOverlay={false}
                >
                  {currentStatus.toUpperCase()}
                </Chip>
              }
            >
              {!statuses
                ? <Menu.Item title="Loading…" disabled />
                : statuses.map((s) => (
                    <Menu.Item
                      key={s.id}
                      onPress={() => handleStatusSelect(s.id, s.name)}
                      title={s.name}
                    />
                  ))
              }
            </Menu>
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

        {/* Contact Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Contact</Text>
          {lead.email ? (
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:' + lead.email)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.primary} style={styles.contactIcon} />
              <Text style={styles.contactText} numberOfLines={1}>{lead.email}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.textMuted} style={styles.contactIcon} />
              <Text style={[styles.contactText, { color: theme.colors.textMuted }]} numberOfLines={1}>No Email</Text>
            </View>
          )}

          {lead.phone ? (
            <TouchableOpacity
              style={styles.contactRow}
              activeOpacity={0.7}
              onPress={() => {
                setOutgoingCall({ leadId: lead.id, leadName: lead.name, leadPhone: lead.phone });
                Linking.openURL('tel:' + lead.phone);
              }}
            >
              <MaterialCommunityIcons name="phone-outline" size={20} color={theme.colors.primary} style={styles.contactIcon} />
              <Text style={styles.contactText} numberOfLines={1}>{lead.phone}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={theme.colors.textMuted} style={styles.contactIcon} />
              <Text style={[styles.contactText, { color: theme.colors.textMuted }]} numberOfLines={1}>No Phone</Text>
            </View>
          )}
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Details</Text>
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
          {lead.website ? (
            <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(lead.website)} activeOpacity={0.7}>
              <Text style={styles.detailLabel}>Website</Text>
              <Text style={[styles.detailValue, { color: '#1e88e5' }]}>{lead.website}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Custom Fields Card */}
        {customFieldsWithValues.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>Custom Fields</Text>
            {customFieldsWithValues.map((f) => (
              <View key={f.id} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{f.name}</Text>
                <Text style={styles.detailValue}>{lead.custom_field_values?.[f.slug ?? f.name]}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tags Section */}
        {lead.tags && lead.tags.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>Tags</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
              {lead.tags.map((tag: string, index: number) => (
                <Chip key={`${tag}-${index}`} mode="outlined" style={styles.tagChip} textStyle={styles.tagChipText} showSelectedOverlay={false}>
                  {tag}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reminders Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabelBold}>Reminders</Text>
          {!reminders || reminders.length === 0 ? (
            <Text style={styles.emptyText}>No reminders set</Text>
          ) : (
            reminders.map((reminder) => {
              const bellColor = reminder.is_notified === 1 ? theme.colors.secondary : theme.colors.primary;
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

        {/* Notes Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabelBold}>Notes</Text>
          {!lead.notes || lead.notes.length === 0 ? (
            <Text style={styles.emptyText}>No notes added yet</Text>
          ) : (
            lead.notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteAuthor}>{note.staff_name || 'Staff'}</Text>
                  <Text style={styles.noteDate}>{formatDateTime(note.dateadded)}</Text>
                </View>
                <Text style={styles.noteBody}>{note.description}</Text>
              </View>
            ))
          )}

          {/* Add note input */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add a note…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddNote}
              disabled={!noteText.trim() || addNoteMutation.isPending}
              style={[styles.sendBtn, (!noteText.trim() || addNoteMutation.isPending) && { opacity: 0.4 }]}
            >
              {addNoteMutation.isPending ? (
                <ActivityIndicator size={20} color={theme.colors.primary} />
              ) : (
                <MaterialCommunityIcons name="send" size={22} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Attachments Card */}
        {lead.attachments && lead.attachments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionLabelBold}>Attachments</Text>
            {lead.attachments.map((att) => (
              <View key={att.id} style={styles.attachmentRow}>
                <MaterialCommunityIcons name="paperclip" size={18} color={theme.colors.textMuted} />
                <Text style={styles.attachmentName} numberOfLines={1}>{att.file_name}</Text>
                <Text style={styles.attachmentDate}>{formatDate(att.dateadded)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Activity Log Card */}
        {lead.activity_log && lead.activity_log.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionLabelBold}>Activity Log</Text>
            {lead.activity_log.map((entry) => (
              <View key={entry.id} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityDesc}>{entry.description}</Text>
                  <Text style={styles.activityDate}>{formatDateTime(entry.date)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions Card */}
        <View style={[styles.card, styles.actionsCard]}>
          <Text style={styles.cardSectionLabel}>Actions</Text>
          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              icon={lead.status?.toLowerCase().includes('lost') ? "flag" : "flag-outline"}
              onPress={handleMarkLost}
              loading={markLostMutation.isPending}
              disabled={markLostMutation.isPending || markJunkMutation.isPending}
              textColor={theme.colors.primary}
              style={[styles.actionBtn, { borderColor: theme.colors.primary }]}
              labelStyle={styles.actionBtnLabel}
            >
              {lead.status?.toLowerCase().includes('lost') ? 'Unmark Lost' : 'Mark Lost'}
            </Button>
            <Button
              mode="outlined"
              icon={lead.status?.toLowerCase().includes('junk') ? "trash-can" : "trash-can-outline"}
              onPress={handleMarkJunk}
              loading={markJunkMutation.isPending}
              disabled={markLostMutation.isPending || markJunkMutation.isPending}
              textColor={theme.colors.error}
              style={[styles.actionBtn, { borderColor: theme.colors.error }]}
              labelStyle={styles.actionBtnLabel}
            >
              {lead.status?.toLowerCase().includes('junk') ? 'Unmark Junk' : 'Mark Junk'}
            </Button>
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.paddingX,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: theme.colors.background,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    ...theme.typography.headlineXlMobile,
    fontSize: 25,
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...theme.typography.labelSm,
    fontSize: 9,
    color: 'rgba(68, 72, 63, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 0,
    alignItems: 'center',
  },
  statusChip: {
    alignSelf: 'center',
    height: 32,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.xl,
    padding: theme.spacing.paddingX,
    marginHorizontal: theme.spacing.margin,
    marginVertical: theme.spacing.gapSm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  actionsCard: {
    marginBottom: theme.spacing.gapLg,
  },
  cardSectionLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginBottom: 12,
    fontWeight: '700',
  },
  cardSectionLabelBold: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
    marginBottom: 12,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactText: {
    flex: 1,
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    width: 110,
  },
  detailValue: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  tagsScroll: {
    gap: 6,
  },
  tagChip: {
    height: 28,
    justifyContent: 'center',
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.md,
  },
  tagChipText: {
    ...theme.typography.labelSm,
    fontSize: 11,
    lineHeight: 12,
    color: theme.colors.onSurfaceVariant,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  reminderCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.roundness.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reminderDesc: {
    ...theme.typography.bodyMd,
    fontWeight: '700',
    color: theme.colors.primary,
    flex: 1,
  },
  reminderDate: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginLeft: 28,
  },
  noteCard: {
    backgroundColor: '#fffbeb', // Sticky note color variant
    borderRadius: theme.roundness.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteAuthor: {
    ...theme.typography.labelSm,
    fontWeight: '700',
    color: '#92400E',
  },
  noteDate: {
    ...theme.typography.labelSm,
    fontSize: 10,
    color: '#a16207',
  },
  noteBody: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    maxHeight: 100,
    backgroundColor: theme.colors.surfaceContainerLow,
    textAlignVertical: 'top',
  },
  sendBtn: {
    padding: 8,
    marginBottom: 2,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  attachmentName: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  attachmentDate: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
  },
  activityDesc: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  activityDate: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionBtn: {
    borderRadius: theme.roundness.xl,
    flex: 1,
    minWidth: 140,
    height: 48,
    justifyContent: 'center',
  },
  actionBtnLabel: {
    ...theme.typography.labelMd,
  },
});


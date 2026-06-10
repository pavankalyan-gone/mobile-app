import { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallStore } from '../../store/callStore';
import { useAddLeadNote, useAddLeadReminder } from '../../hooks/useLeads';
import { theme } from '../../constants/theme';

interface ReminderOption {
  label: string;
  getDate: () => Date;
}

const REMINDER_OPTIONS: ReminderOption[] = [
  {
    label: 'In 1 hour',
    getDate: () => {
      const d = new Date();
      d.setHours(d.getHours() + 1);
      return d;
    },
  },
  {
    label: 'In 3 hours',
    getDate: () => {
      const d = new Date();
      d.setHours(d.getHours() + 3);
      return d;
    },
  },
  {
    label: 'Tomorrow 9am',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  {
    label: 'Next week',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];

function formatDateForApi(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export function PostCallModal() {
  const { pendingCall, modalVisible, dismissModal } = useCallStore();
  const addNote = useAddLeadNote();
  const addReminder = useAddLeadReminder();

  const [note, setNote] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<number | null>(null);
  const [reminderDesc, setReminderDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!modalVisible || !pendingCall) return null;

  const handleClose = () => {
    setNote('');
    setSelectedReminder(null);
    setReminderDesc('');
    setSaveError(null);
    dismissModal();
  };

  const handleSave = async () => {
    if (!note.trim() && selectedReminder === null) {
      handleClose();
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const leadId = pendingCall.leadId;

    try {
      if (note.trim()) {
        await addNote.mutateAsync({ id: leadId, description: note.trim() });
      }

      if (selectedReminder !== null) {
        const date = REMINDER_OPTIONS[selectedReminder].getDate();
        const description = reminderDesc.trim() || `Follow up after call with ${pendingCall.leadName}`;
        await addReminder.mutateAsync({
          leadId,
          payload: {
            description,
            date: formatDateForApi(date),
            notify_by_email: 0,
          },
        });
      }
      handleClose();
    } catch {
      // Keep the modal (and the user's text) open so nothing is silently lost
      setSaveError('Could not save. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const callDuration = pendingCall.startedAt
    ? Math.round((Date.now() - pendingCall.startedAt) / 1000 / 60)
    : 0;
  const isIncoming = pendingCall.direction === 'incoming';

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.callIconBg, { backgroundColor: isIncoming ? '#ffd8ed' : '#cfebba' }]}>
                <MaterialCommunityIcons
                  name={isIncoming ? 'phone-incoming' : 'phone-outgoing'}
                  size={22}
                  color={isIncoming ? '#290a21' : theme.colors.primary}
                />
              </View>
              <View>
                <Text style={styles.title}>
                  {isIncoming ? 'Incoming call' : 'Call'} — {pendingCall.leadName}
                </Text>
                <Text style={styles.subtitle}>
                  {pendingCall.leadPhone}
                  {callDuration > 0 ? `  ·  ~${callDuration} min` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Note section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <MaterialCommunityIcons name="note-text-outline" size={14} color={theme.colors.primary} />
                {'  '}Call Notes
              </Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="What was discussed? Any follow-up needed?"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                maxLength={2000}
                textAlignVertical="top"
              />
            </View>

            {/* Reminder section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <MaterialCommunityIcons name="bell-outline" size={14} color={theme.colors.primary} />
                {'  '}Set a Reminder
              </Text>
              <View style={styles.reminderChips}>
                {REMINDER_OPTIONS.map((opt, idx) => (
                  <Chip
                    key={idx}
                    mode={selectedReminder === idx ? 'flat' : 'outlined'}
                    selected={selectedReminder === idx}
                    onPress={() => setSelectedReminder(selectedReminder === idx ? null : idx)}
                    style={selectedReminder === idx ? styles.chipSelected : styles.chipUnselected}
                    textStyle={selectedReminder === idx ? styles.chipTextSelected : styles.chipTextUnselected}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </View>

              {selectedReminder !== null && (
                <TextInput
                  style={styles.reminderInput}
                  value={reminderDesc}
                  onChangeText={setReminderDesc}
                  placeholder={`Follow up after call with ${pendingCall.leadName}`}
                  placeholderTextColor={theme.colors.textMuted}
                  maxLength={500}
                />
              )}
            </View>
          </ScrollView>

          {saveError && <Text style={styles.errorText}>{saveError}</Text>}

          {/* Actions */}
          <View style={styles.actions}>
            <Button mode="text" onPress={handleClose} textColor={theme.colors.textMuted}>
              Skip
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveBtn}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
            >
              {saveError ? 'Retry' : 'Save'}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness.xl,
    borderTopRightRadius: theme.roundness.xl,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  callIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.labelLg,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  subtitle: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  section: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerLow,
  },
  sectionLabel: {
    ...theme.typography.labelSm,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.md,
    padding: 12,
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
    minHeight: 96,
    backgroundColor: theme.colors.surfaceContainerLow,
    textAlignVertical: 'top',
  },
  reminderChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
  },
  chipTextSelected: {
    ...theme.typography.labelSm,
    color: theme.colors.onPrimary,
  },
  chipTextUnselected: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
  },
  reminderInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.default,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  errorText: {
    ...theme.typography.labelSm,
    color: theme.colors.error,
    paddingTop: 12,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 16,
    gap: 8,
  },
  saveBtn: {
    borderRadius: theme.roundness.xl,
    paddingHorizontal: 8,
  },
});

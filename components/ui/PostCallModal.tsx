import { useState, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallStore } from '../../store/callStore';
import { useCallLogStore } from '../../store/callLogStore';
import { useAddLeadNote, useAddLeadReminder } from '../../hooks/useLeads';
import { REMINDER_OPTIONS, formatDateForApi } from '../../utils/reminderPresets';
import { scheduleReminderNotification } from '../../utils/reminderNotifications';
import { addToOutbox } from '../../utils/outbox';
import { theme } from '../../constants/theme';
import * as SecureStore from '../../utils/secureStore';
import { PERFEX_API_URL, PERFEX_TOKEN_KEY } from '../../constants/config';
import perfexApi from '../../services/perfexApi';

export function PostCallModal() {
  const { pendingCall, modalVisible, dismissModal } = useCallStore();
  const markNoteSaved = useCallLogStore((s) => s.markNoteSaved);
  const addNote = useAddLeadNote();
  const addReminder = useAddLeadReminder();

  const [note, setNote] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<number | null>(null);
  const [reminderDesc, setReminderDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Survives a Retry after a partial failure, so the note isn't posted twice
  const noteSavedRef = useRef(false);

  if (!modalVisible || !pendingCall) return null;

  // Matches the id format used by callLogStore.addEntry in app/_layout.tsx
  const callLogId = `${pendingCall.leadId}-${pendingCall.startedAt}`;

  const handleClose = () => {
    setNote('');
    setSelectedReminder(null);
    setReminderDesc('');
    setSaveError(null);
    noteSavedRef.current = false;
    dismissModal();
  };

  /** User dismissed without saving anything — keep a minimal trace in the CRM. */
  const handleSkip = () => {
    const { leadId, direction, startedAt } = pendingCall;
    const mins = startedAt ? Math.round((Date.now() - startedAt) / 60000) : 0;
    const description = `${direction === 'incoming' ? 'Incoming' : 'Outgoing'} call${mins > 0 ? ` (~${mins} min)` : ''} — logged automatically`;
    addNote.mutate(
      { id: leadId, description },
      {
        onError: (err: any) => {
          // Offline: queue it; otherwise drop silently — it's only an auto-log
          if (!err?.response) addToOutbox({ kind: 'note', leadId, description, queuedAt: Date.now() });
        },
      }
    );
    handleClose();
  };

  const buildReminder = () => {
    if (selectedReminder === null) return null;
    return {
      date: REMINDER_OPTIONS[selectedReminder].getDate(),
      description: reminderDesc.trim() || `Follow up after call with ${pendingCall.leadName}`,
    };
  };

  const handleSave = async () => {
    if (!note.trim() && selectedReminder === null) {
      handleSkip();
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const { leadId, leadName } = pendingCall;
    const reminder = buildReminder();

    try {
      if (note.trim() && !noteSavedRef.current) {
        await addNote.mutateAsync({ id: leadId, description: note.trim() });
        noteSavedRef.current = true;
        markNoteSaved(callLogId);
      }

      if (reminder) {
        await addReminder.mutateAsync({
          leadId,
          payload: {
            description: reminder.description,
            date: formatDateForApi(reminder.date),
            notify_by_email: 0,
          },
        });
        scheduleReminderNotification({ leadId, leadName, description: reminder.description, date: reminder.date });
      }
      handleClose();
    } catch (err: any) {
      if (!err?.response) {
        // Offline — queue everything still unsaved and let the outbox sync it
        if (note.trim() && !noteSavedRef.current) {
          await addToOutbox({ kind: 'note', leadId, description: note.trim(), queuedAt: Date.now() });
          markNoteSaved(callLogId);
        }
        if (reminder) {
          await addToOutbox({
            kind: 'reminder',
            leadId,
            payload: { description: reminder.description, date: formatDateForApi(reminder.date), notify_by_email: 0 },
            queuedAt: Date.now(),
          });
          scheduleReminderNotification({ leadId, leadName, description: reminder.description, date: reminder.date });
        }
        handleClose();
        Alert.alert('Saved offline', 'You appear to be offline. This will sync automatically once you reconnect.');
        return;
      }
      console.error('SAVE ERROR:', err?.response?.status, err?.response?.data);
      // Keep the modal (and the user's text) open so nothing is silently lost
      setSaveError(`Error: ${err?.response?.status} - ${typeof err?.response?.data === 'string' ? err?.response?.data.slice(0, 50) : JSON.stringify(err?.response?.data)}`);
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
      onRequestClose={handleSkip}
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
                  // fixed light accent backgrounds need a fixed dark icon color
                  color={isIncoming ? '#290a21' : '#1b300f'}
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
              onPress={handleSkip}
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
            <Button mode="text" onPress={handleSkip} textColor={theme.colors.textMuted}>
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

import { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallStore } from '../../store/callStore';
import { useAddLeadNote, useAddLeadReminder } from '../../hooks/useLeads';

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

  if (!modalVisible || !pendingCall) return null;

  const handleClose = () => {
    setNote('');
    setSelectedReminder(null);
    setReminderDesc('');
    dismissModal();
  };

  const handleSave = async () => {
    if (!note.trim() && selectedReminder === null) {
      handleClose();
      return;
    }

    setIsSaving(true);
    const leadId = pendingCall.leadId;

    try {
      if (note.trim()) {
        await new Promise<void>((resolve, reject) =>
          addNote.mutate(
            { id: leadId, description: note.trim() },
            { onSuccess: () => resolve(), onError: reject }
          )
        );
      }

      if (selectedReminder !== null) {
        const date = REMINDER_OPTIONS[selectedReminder].getDate();
        const description = reminderDesc.trim() || `Follow up after call with ${pendingCall.leadName}`;
        await new Promise<void>((resolve, reject) =>
          addReminder.mutate(
            {
              leadId,
              payload: {
                description,
                date: formatDateForApi(date),
                notify_by_email: 0,
              },
            },
            { onSuccess: () => resolve(), onError: reject }
          )
        );
      }
    } catch (err) {
      console.error('Post-call save failed:', err);
    } finally {
      setIsSaving(false);
      handleClose();
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
              <View style={[styles.callIconBg, { backgroundColor: isIncoming ? '#DBEAFE' : '#DCFCE7' }]}>
                <MaterialCommunityIcons
                  name={isIncoming ? 'phone-incoming' : 'phone-outgoing'}
                  size={22}
                  color={isIncoming ? '#1D4ED8' : '#16A34A'}
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
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Note section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <MaterialCommunityIcons name="note-text-outline" size={14} color="#6750A4" />
                {'  '}Call Notes
              </Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="What was discussed? Any follow-up needed?"
                placeholderTextColor="#bbb"
                multiline
                autoFocus
                textAlignVertical="top"
              />
            </View>

            {/* Reminder section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                <MaterialCommunityIcons name="bell-outline" size={14} color="#6750A4" />
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
                  placeholderTextColor="#bbb"
                />
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button mode="text" onPress={handleClose} textColor="#888">
              Skip
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveBtn}
            >
              Save
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  section: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6750A4',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 96,
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
  },
  reminderChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chipSelected: {
    backgroundColor: '#6750A4',
  },
  chipUnselected: {
    borderColor: '#e0e0e0',
  },
  chipTextSelected: {
    color: '#fff',
    fontSize: 12,
  },
  chipTextUnselected: {
    color: '#555',
    fontSize: 12,
  },
  reminderInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 16,
    gap: 8,
  },
  saveBtn: {
    borderRadius: 8,
    paddingHorizontal: 8,
  },
});

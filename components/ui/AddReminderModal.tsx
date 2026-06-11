import { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Portal, Modal, Text, Button, Chip } from 'react-native-paper';
import { useAddLeadReminder } from '../../hooks/useLeads';
import { REMINDER_OPTIONS, formatDateForApi } from '../../utils/reminderPresets';
import { scheduleReminderNotification } from '../../utils/reminderNotifications';
import { theme } from '../../constants/theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  leadId: number;
  leadName: string;
}

/** Parses "YYYY-MM-DD" or "YYYY-MM-DD HH:MM" as a local-time date. */
function parseCustomDate(input: string): Date | null {
  const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const date = new Date(
    Number(m[1]), Number(m[2]) - 1, Number(m[3]),
    m[4] ? Number(m[4]) : 9, m[5] ? Number(m[5]) : 0, 0, 0
  );
  return isNaN(date.getTime()) ? null : date;
}

export function AddReminderModal({ visible, onDismiss, leadId, leadName }: Props) {
  const addReminder = useAddLeadReminder();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);
  const [customDate, setCustomDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedPreset(0);
    setCustomDate('');
    setDescription('');
    setError(null);
    onDismiss();
  };

  const handleSave = async () => {
    // A typed custom date wins over the preset chips
    let date: Date | null = null;
    if (customDate.trim()) {
      date = parseCustomDate(customDate);
      if (!date) {
        setError('Enter the date as YYYY-MM-DD or YYYY-MM-DD HH:MM');
        return;
      }
      if (date.getTime() <= Date.now()) {
        setError('The reminder date must be in the future.');
        return;
      }
    } else if (selectedPreset !== null) {
      date = REMINDER_OPTIONS[selectedPreset].getDate();
    }
    if (!date) {
      setError('Pick a time or enter a date.');
      return;
    }

    const desc = description.trim() || `Follow up with ${leadName}`;
    setError(null);
    try {
      await addReminder.mutateAsync({
        leadId,
        payload: { description: desc, date: formatDateForApi(date), notify_by_email: 0 },
      });
      scheduleReminderNotification({ leadId, leadName, description: desc, date });
      handleClose();
    } catch {
      setError('Could not save the reminder. Check your connection and try again.');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modal}>
        <Text style={styles.title}>New Reminder</Text>

        <Text style={styles.sectionLabel}>When</Text>
        <View style={styles.chips}>
          {REMINDER_OPTIONS.map((opt, idx) => (
            <Chip
              key={opt.label}
              mode={selectedPreset === idx && !customDate.trim() ? 'flat' : 'outlined'}
              selected={selectedPreset === idx && !customDate.trim()}
              onPress={() => {
                setSelectedPreset(idx);
                setCustomDate('');
              }}
            >
              {opt.label}
            </Chip>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={customDate}
          onChangeText={setCustomDate}
          placeholder="Custom: YYYY-MM-DD HH:MM"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={16}
        />

        <Text style={styles.sectionLabel}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder={`Follow up with ${leadName}`}
          placeholderTextColor={theme.colors.textMuted}
          maxLength={500}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.actions}>
          <Button mode="text" onPress={handleClose} textColor={theme.colors.textMuted}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={addReminder.isPending}
            disabled={addReminder.isPending}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.margin,
    borderRadius: theme.roundness.xl,
    padding: 20,
  },
  title: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionLabel: {
    ...theme.typography.labelSm,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.roundness.default,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLow,
    marginBottom: 14,
  },
  errorText: {
    ...theme.typography.labelSm,
    color: theme.colors.error,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});

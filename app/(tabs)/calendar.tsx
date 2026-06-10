import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReminders } from '../../hooks/useReminders';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { formatDate, formatDateTime, toDateKey } from '../../utils/format';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => toDateKey(new Date().toISOString()) ?? new Date().toISOString().split('T')[0]
  );

  const { data: reminders, isLoading } = useReminders();

  // Mark every day that has at least one reminder
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    (reminders ?? []).forEach((reminder) => {
      const key = toDateKey(reminder.due_date);
      if (key) marks[key] = { marked: true, dotColor: theme.colors.secondary };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: theme.colors.primary,
    };
    return marks;
  }, [reminders, selectedDate]);

  const dayReminders = useMemo(
    () => (reminders ?? []).filter((r) => toDateKey(r.due_date) === selectedDate),
    [reminders, selectedDate]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="Calendar" subtitle={formatDate(new Date().toISOString())} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: DateData) => {
              setSelectedDate(day.dateString);
            }}
            markedDates={markedDates}
            theme={{
              backgroundColor: theme.colors.surface,
              calendarBackground: theme.colors.surface,
              textSectionTitleColor: theme.colors.onSurfaceVariant,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.onPrimary,
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.onSurface,
              textDisabledColor: theme.colors.outlineVariant,
              dotColor: theme.colors.primary,
              selectedDotColor: theme.colors.onPrimary,
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.primary,
              textMonthFontWeight: 'bold',
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.agendaContainer}>
          <Text style={styles.agendaTitle}>Reminders for {formatDate(selectedDate)}</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.agendaLoader} />
          ) : dayReminders.length === 0 ? (
            <Card style={styles.eventCard}>
              <Card.Content>
                <Text style={styles.eventTitle}>No reminders scheduled</Text>
                <Text style={styles.eventSubtitle}>Reminders you add to leads will show up here</Text>
              </Card.Content>
            </Card>
          ) : (
            dayReminders.map((reminder) => (
              <Card key={reminder.id} style={styles.eventCard}>
                <Card.Content style={styles.eventContent}>
                  <MaterialCommunityIcons
                    name={reminder.is_read ? 'bell-check-outline' : 'bell-outline'}
                    size={22}
                    color={reminder.is_read ? theme.colors.secondary : theme.colors.primary}
                  />
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle}>{reminder.title}</Text>
                    <Text style={styles.eventSubtitle}>{formatDateTime(reminder.due_date)}</Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  calendarContainer: {
    marginHorizontal: theme.spacing.margin,
    borderRadius: theme.roundness.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(196, 200, 188, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    marginBottom: 24,
  },
  calendar: {
    borderRadius: theme.roundness.xl,
  },
  agendaContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.margin,
  },
  agendaTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    marginBottom: 16,
  },
  agendaLoader: {
    paddingVertical: theme.spacing.gapMd,
  },
  eventCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: 'rgba(196, 200, 188, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: theme.spacing.gapSm,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    ...theme.typography.labelLg,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  eventSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    opacity: 0.8,
  },
});

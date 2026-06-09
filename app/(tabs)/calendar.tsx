import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSubtitle}>{new Date().toDateString()}</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="calendar-month" size={24} iconColor={theme.colors.primary} onPress={() => {}} style={styles.headerIconBtn} />
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: DateData) => {
            setSelectedDate(day.dateString);
          }}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: theme.colors.primary },
            '2026-06-15': { marked: true, dotColor: theme.colors.secondaryContainer },
            '2026-06-18': { marked: true, dotColor: theme.colors.errorRed },
          }}
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
        <Text style={styles.agendaTitle}>Events for {selectedDate}</Text>
        <Card style={styles.eventCard}>
          <Card.Content>
            <Text style={styles.eventTitle}>No events scheduled</Text>
            <Text style={styles.eventSubtitle}>Tap the + button to add one</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => {}}>
        <MaterialCommunityIcons name="plus" size={28} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexDirection: 'column',
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
  },
  headerIconBtn: {
    margin: 0,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
});

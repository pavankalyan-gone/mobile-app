import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DashboardRenderer } from '../components/DashboardRenderer';
import { DynamicNavigationBuilder } from '../components/DynamicNavigationBuilder';
import { WorkspaceDropdown } from '../components/WorkspaceDropdown';
import { ProfileHeader } from '../components/ProfileHeader';

export const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <View style={styles.container}>
      {/* Phase 17: Header Layout */}
      <View style={styles.header}>
        <ProfileHeader />
        <WorkspaceDropdown />
      </View>

      {/* Phase 17: Body (Dashboard or Active Module) */}
      <ScrollView style={styles.body}>
        {activeTab === 'dashboard' ? (
          <DashboardRenderer />
        ) : (
          <View style={styles.modulePlaceholder}>
            {/* Here the ScreenRegistry would resolve activeTab to a specific module screen */}
          </View>
        )}
      </ScrollView>

      {/* Phase 17 & 4: Bottom Navigation generated from API */}
      <View style={styles.footer}>
        <DynamicNavigationBuilder 
          onNavigate={(routeId) => setActiveTab(routeId)} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50, // SafeArea substitute
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  body: {
    flex: 1,
  },
  modulePlaceholder: {
    flex: 1,
    padding: 16,
  },
  footer: {
    height: 60,
    backgroundColor: '#fff',
  }
});

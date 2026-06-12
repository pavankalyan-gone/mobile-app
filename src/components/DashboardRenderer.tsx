import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWorkspaceStore } from '../store/WorkspaceStore';

// Mock components for widgets
const WelcomeBanner = () => <View style={styles.widget}><Text>Welcome Banner Widget</Text></View>;
const RecentEstimates = () => <View style={styles.widget}><Text>Recent Estimates Widget</Text></View>;
const UserStatistics = () => <View style={styles.widget}><Text>User Statistics Widget</Text></View>;
const UnknownWidget = ({ type }: { type: string }) => <View style={styles.widget}><Text>Unknown: {type}</Text></View>;

const WIDGET_REGISTRY: Record<string, React.FC<any>> = {
  'welcome_banner': WelcomeBanner,
  'recent_estimates': RecentEstimates,
  'user_statistics': UserStatistics,
};

export const DashboardRenderer = () => {
  const dashboard = useWorkspaceStore(state => state.dashboard);

  return (
    <View style={styles.container}>
      {dashboard.map((widget, index) => {
        const WidgetComponent = WIDGET_REGISTRY[widget.type] || UnknownWidget;
        return <WidgetComponent key={index} type={widget.type} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  widget: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  }
});

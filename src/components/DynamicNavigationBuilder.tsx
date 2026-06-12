import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWorkspaceStore } from '../store/WorkspaceStore';

export const DynamicNavigationBuilder = ({ onNavigate }: { onNavigate: (routeId: string) => void }) => {
  const { bottom_nav, sidebar } = useWorkspaceStore(state => state.navigation);

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.header}>Apps & Modules</Text>
        {sidebar.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.navItem}
            onPress={() => onNavigate(item.id)}
          >
            <Text style={styles.navText}>{item.icon} {item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomNav}>
        {bottom_nav.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.bottomNavItem}
            onPress={() => onNavigate(item.id)}
          >
            <Text style={styles.navText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRightWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  navItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  navText: {
    fontSize: 16,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 250,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  bottomNavItem: {
    padding: 8,
  }
});

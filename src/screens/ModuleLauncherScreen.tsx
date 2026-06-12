import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppRegistryService, AppRegistryItem } from '../services/AppRegistryService';
import { usePolicy } from '../hooks/usePolicy';

export const ModuleLauncherScreen = ({ onLaunch }: { onLaunch: (module: string) => void }) => {
  const [apps, setApps] = useState<AppRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasAppAccess } = usePolicy();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await AppRegistryService.getApps();
        setApps(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} />;

  // Filter apps to only those the user has policy access to within the current workspace
  const accessibleApps = apps.filter(app => hasAppAccess(app.app_slug));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Applications</Text>
      <FlatList
        data={accessibleApps}
        numColumns={2}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => onLaunch(item.app_slug)}
          >
            <Text style={styles.icon}>{item.app_icon || '📱'}</Text>
            <Text style={styles.appName}>{item.app_name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
    marginBottom: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  }
});

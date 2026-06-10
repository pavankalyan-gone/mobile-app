import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export const OfflineBanner: React.FC = () => {
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();

  if (netInfo.isConnected !== false) {
    return null;
  }

  return (
    // Android is edge-to-edge too, so respect the status bar inset on both platforms
    <View style={[styles.banner, { paddingTop: insets.top + 4 }]}>
      <MaterialCommunityIcons name="wifi-off" size={16} color="#ffffff" style={styles.icon} />
      <Text style={styles.text}>
        You're offline — showing cached data
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ba1a1a', // theme.colors.error
    width: '100%',
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    gap: 6,
  },
  icon: {
    marginTop: 0,
  },
  text: {
    ...theme.typography.labelSm,
    color: '#ffffff',
    fontWeight: '700',
  },
});

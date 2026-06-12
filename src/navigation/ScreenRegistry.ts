import React from 'react';
import { View, Text } from 'react-native';

// Fallback screen for unmapped modules
const FallbackScreen = ({ module }: { module: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Module Not Implemented: {module}</Text>
  </View>
);

// Registry maps dynamic backend 'app_slug' or 'feature_key' to native React screens
export const SCREEN_REGISTRY: Record<string, React.FC<any>> = {
  // 'crm': CRMScreen,
  // 'estimator': EstimatorScreen,
};

export const resolveScreen = (moduleKey: string): React.FC<any> => {
  return SCREEN_REGISTRY[moduleKey] || FallbackScreen;
};

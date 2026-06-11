import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallStore } from '../../store/callStore';
import { theme } from '../../constants/theme';

/** How long the banner stays up if no call-state event ever dismisses it. */
const AUTO_HIDE_MS = 60 * 1000;

/**
 * Global caller-ID banner. Rendered once in the root layout so it overlays
 * whatever screen the user is on the moment a known lead calls.
 */
export function IncomingCallBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pendingCall, bannerVisible, hideBanner } = useCallStore();
  const slideAnim = useRef(new Animated.Value(-160)).current;

  const visible = bannerVisible && pendingCall?.direction === 'incoming';

  useEffect(() => {
    if (!visible) return;

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();

    const timer = setTimeout(hideBanner, AUTO_HIDE_MS);
    return () => {
      clearTimeout(timer);
      slideAnim.setValue(-160);
    };
  }, [visible, slideAnim, hideBanner]);

  if (!visible || !pendingCall) return null;

  const handleViewLead = () => {
    hideBanner();
    router.push(`/lead/${pendingCall.leadId}`);
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 8, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.banner}>
        <View style={styles.iconWrapper}>
          {/* fixed light accent circle needs a fixed dark icon color */}
          <MaterialCommunityIcons name="phone-incoming" size={22} color="#1b300f" />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{pendingCall.leadName}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Incoming call · {pendingCall.leadPhone}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={handleViewLead}
          accessibilityRole="button"
          accessibilityLabel={`View lead ${pendingCall.leadName}`}
        >
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={hideBanner}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <MaterialCommunityIcons name="close" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    paddingHorizontal: theme.spacing.paddingX,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#cfebba',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    ...theme.typography.labelLg,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  subtitle: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  viewBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewBtnText: {
    ...theme.typography.labelSm,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
});

import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useWorkspaceStore } from '../store/WorkspaceStore';
import { WorkspaceService } from '../services/WorkspaceService';
import { eventBus } from '../utils/EventBus';

// Configure how notifications behave when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // 1. Listen for foreground notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // If we receive a "permissions_changed" silent notification or system notification
      const data = notification.request.content.data;
      if (data?.type === 'SYNC_REQUIRED') {
        const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
        if (workspaceId) {
          // Trigger background sync to immediately update context
          WorkspaceService.syncContext(workspaceId).then(response => {
            if (response.action === 'update_context') {
              useWorkspaceStore.getState().updateContext(response.context);
              eventBus.emit('PermissionChanged');
            } else if (response.action === 'workspace_revoked') {
              // The sync service determined the workspace was revoked
              eventBus.emit('AccessRevoked');
            }
          });
        }
      }
    });

    // 2. Listen for background notification taps (Deep Linking)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.route) {
        // Here we could integrate with Expo Router to push the specific route
        // router.push(data.route);
        console.log('Deep Link to:', data.route);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return <>{children}</>;
};

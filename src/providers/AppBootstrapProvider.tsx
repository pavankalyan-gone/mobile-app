import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/AuthStore';
import { useWorkspaceStore } from '../store/WorkspaceStore';
import { SessionMonitor } from '../services/SessionMonitor';
import { SplashScreen } from '../screens/SplashScreen';
import { eventBus } from '../utils/EventBus';
import { NotificationProvider } from './NotificationProvider';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export const AppBootstrapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkSession, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { fetchWorkspaces, isLoading: workspaceLoading, currentWorkspace } = useWorkspaceStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    // 1. Validate Access Token & Session
    checkSession().then(() => {
      setIsBootstrapping(false);
    });
  }, []);

  useEffect(() => {
    // 2. Fetch Workspaces when authenticated
    if (isAuthenticated) {
      fetchWorkspaces();
      SessionMonitor.getInstance().startMonitoring();
    } else {
      SessionMonitor.getInstance().stopMonitoring();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Phase 28: Invalidate queries when workspace changes
    const unsubscribe = eventBus.on('WorkspaceChanged', () => {
      queryClient.invalidateQueries();
    });
    return () => unsubscribe();
  }, []);

  if (isBootstrapping || (isAuthenticated && workspaceLoading && !currentWorkspace)) {
    return <SplashScreen />;
  }

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

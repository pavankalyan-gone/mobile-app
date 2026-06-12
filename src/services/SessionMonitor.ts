import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/AuthStore';
import { useWorkspaceStore } from '../store/WorkspaceStore';
import { eventBus } from '../utils/EventBus';
import { WorkspaceService } from '../services/WorkspaceService';

export class SessionMonitor {
  private static instance: SessionMonitor;
  private syncInterval: any;

  static getInstance() {
    if (!SessionMonitor.instance) {
      SessionMonitor.instance = new SessionMonitor();
    }
    return SessionMonitor.instance;
  }

  startMonitoring() {
    AppState.addEventListener('change', this.handleAppStateChange);
    // Sync every 5 minutes while active
    this.syncInterval = setInterval(() => {
      this.syncContext();
    }, 5 * 60 * 1000);
  }

  stopMonitoring() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      this.syncContext();
    }
  }

  private async syncContext() {
    const auth = useAuthStore.getState();
    const workspace = useWorkspaceStore.getState();

    if (!auth.isAuthenticated || !workspace.currentWorkspace) return;

    try {
      const response = await WorkspaceService.syncContext(workspace.currentWorkspace.id);
      
      // The API returns the context and a sync hash
      if (response.status === 'active' && response.action === 'update_context') {
        // Compare hash and trigger update if needed
        if (response.context.sync_hash !== workspace.syncHash) {
          workspace.updateContext(response.context);
          eventBus.emit('PermissionChanged');
        }
      }
    } catch (error: any) {
      // The apiClient interceptor handles 403 AccessRevoked automatically
      console.log('Background sync failed', error);
    }
  }
}

export const sessionMonitor = SessionMonitor.getInstance();

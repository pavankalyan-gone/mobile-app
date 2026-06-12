import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkspaceService } from './WorkspaceService';
import { AppRegistryService } from './AppRegistryService';

export class OfflineSyncManager {
  private static CACHE_KEYS = {
    WORKSPACES: '@cache_workspaces',
    REGISTRY: '@cache_app_registry',
    CONTEXT_PREFIX: '@cache_context_',
  };

  /**
   * Caches the list of workspaces
   */
  static async cacheWorkspaces(workspaces: any) {
    try {
      await AsyncStorage.setItem(this.CACHE_KEYS.WORKSPACES, JSON.stringify(workspaces));
    } catch (e) {
      console.error('Failed to cache workspaces', e);
    }
  }

  /**
   * Caches context data (navigation, dashboard, permissions) for a specific workspace
   */
  static async cacheWorkspaceContext(workspaceId: number, context: any) {
    try {
      await AsyncStorage.setItem(`${this.CACHE_KEYS.CONTEXT_PREFIX}${workspaceId}`, JSON.stringify(context));
    } catch (e) {
      console.error('Failed to cache context', e);
    }
  }

  /**
   * Loads the cached context for offline startup
   */
  static async getCachedContext(workspaceId: number) {
    try {
      const data = await AsyncStorage.getItem(`${this.CACHE_KEYS.CONTEXT_PREFIX}${workspaceId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Performs an immediate sync of data if online
   */
  static async performSync(workspaceId: number) {
    try {
      // 1. Fetch apps
      const apps = await AppRegistryService.getApps();
      await AsyncStorage.setItem(this.CACHE_KEYS.REGISTRY, JSON.stringify(apps));

      // 2. Sync context
      const contextResponse = await WorkspaceService.syncContext(workspaceId);
      if (contextResponse.action === 'update_context') {
        await this.cacheWorkspaceContext(workspaceId, contextResponse.context);
        return contextResponse.context;
      }
    } catch (e) {
      // Fallback to cache if network fails
      return await this.getCachedContext(workspaceId);
    }
  }
}

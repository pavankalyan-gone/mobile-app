import { create } from 'zustand';
import { Workspace, WorkspaceService } from '../services/WorkspaceService';
import { eventBus } from '../utils/EventBus';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  type?: string;
}

interface Widget {
  type: string;
}

interface ContextData {
  workspace_id: number;
  navigation: {
    bottom_nav: NavigationItem[];
    sidebar: NavigationItem[];
  };
  dashboard: Widget[];
  sync_hash: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  navigation: { bottom_nav: NavigationItem[]; sidebar: NavigationItem[] };
  dashboard: Widget[];
  syncHash: string;
  isLoading: boolean;
  
  fetchWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: number) => Promise<void>;
  updateContext: (context: ContextData) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  navigation: { bottom_nav: [], sidebar: [] },
  dashboard: [],
  syncHash: '',
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const workspaces = await WorkspaceService.getWorkspaces();
      set({ workspaces });
      
      if (workspaces.length > 0 && !get().currentWorkspace) {
        // Auto-select default
        const defaultWs = workspaces.find(w => w.default) || workspaces[0];
        await get().switchWorkspace(defaultWs.id);
      }
    } catch (e) {
      console.error('Failed to fetch workspaces', e);
    } finally {
      set({ isLoading: false });
    }
  },

  switchWorkspace: async (workspaceId: number) => {
    set({ isLoading: true });
    try {
      const workspaces = get().workspaces;
      const targetWorkspace = workspaces.find(w => w.id === workspaceId);
      
      if (!targetWorkspace) throw new Error('Workspace not found');

      const response = await WorkspaceService.switchWorkspace(workspaceId);
      
      set({ currentWorkspace: targetWorkspace });
      
      // After switching, sync the new context
      const syncResponse = await WorkspaceService.syncContext(workspaceId);
      if (syncResponse.action === 'update_context') {
        get().updateContext(syncResponse.context);
      }
      
      eventBus.emit('WorkspaceChanged');
    } catch (e) {
      console.error('Workspace switch failed', e);
    } finally {
      set({ isLoading: false });
    }
  },

  updateContext: (context: ContextData) => {
    set({
      navigation: context.navigation,
      dashboard: context.dashboard,
      syncHash: context.sync_hash,
    });
  },

  clearWorkspace: () => {
    set({
      workspaces: [],
      currentWorkspace: null,
      navigation: { bottom_nav: [], sidebar: [] },
      dashboard: [],
      syncHash: ''
    });
  }
}));

// Setup listener for logout
eventBus.on('Logout', () => {
  useWorkspaceStore.getState().clearWorkspace();
});

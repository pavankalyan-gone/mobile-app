import { useAuthStore } from '../../store/AuthStore';
import { useWorkspaceStore } from '../../store/WorkspaceStore';
import { eventBus } from '../EventBus';

// Mock dependencies
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../services/WorkspaceService', () => ({
  WorkspaceService: {
    getWorkspaces: jest.fn().mockResolvedValue([{ id: 1, name: 'HQ', default: true }]),
    switchWorkspace: jest.fn().mockResolvedValue({ status: 'success' }),
    syncContext: jest.fn().mockResolvedValue({
      status: 'active',
      action: 'update_context',
      context: {
        workspace_id: 1,
        navigation: {
          bottom_nav: [{ id: 'home', label: 'Home' }],
          sidebar: [{ id: 'crm', label: 'CRM Module' }]
        },
        dashboard: [{ type: 'welcome_banner' }],
        sync_hash: 'mock_hash'
      }
    })
  }
}));

describe('Mobile App End-to-End Dynamic Flows', () => {
  beforeEach(() => {
    // Reset stores
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
    useWorkspaceStore.setState({
      workspaces: [],
      currentWorkspace: null,
      navigation: { bottom_nav: [], sidebar: [] },
      dashboard: [],
      syncHash: ''
    });
  });

  it('Phase 1: Validates Authentication Flow', async () => {
    const mockUser = { id: 1, name: 'Test', email: 'test@test.com' };
    
    let loginEventFired = false;
    eventBus.on('LoginSuccess', () => { loginEventFired = true; });

    await useAuthStore.getState().login('mock_access', 'mock_refresh', mockUser);
    
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.name).toBe('Test');
    expect(loginEventFired).toBe(true);
  });

  it('Phase 2, 4, 5: Workspace Switching Triggers Dynamic Menu & Dashboard Updates', async () => {
    let workspaceChangedEvent = false;
    eventBus.on('WorkspaceChanged', () => { workspaceChangedEvent = true; });

    await useWorkspaceStore.getState().fetchWorkspaces();
    
    // Automatically switches to default workspace (ID 1)
    expect(useWorkspaceStore.getState().currentWorkspace?.name).toBe('HQ');
    
    // Validates dynamic navigation parsing
    const nav = useWorkspaceStore.getState().navigation;
    expect(nav.sidebar[0].id).toBe('crm');
    
    // Validates dashboard parsing
    const dashboard = useWorkspaceStore.getState().dashboard;
    expect(dashboard[0].type).toBe('welcome_banner');
    
    expect(workspaceChangedEvent).toBe(true);
  });

  it('Phase 8 & 11: Access Revocation Forces Secure Logout', async () => {
    // Simulate user logged in
    useAuthStore.setState({ isAuthenticated: true });
    
    let logoutEventFired = false;
    eventBus.on('Logout', () => { logoutEventFired = true; });

    // Emulate API Interceptor throwing a 403 Access Revoked
    eventBus.emit('AccessRevoked');

    // Wait for the async logout to finish
    await new Promise(process.nextTick);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(logoutEventFired).toBe(true);
    expect(useWorkspaceStore.getState().currentWorkspace).toBeNull();
  });
});

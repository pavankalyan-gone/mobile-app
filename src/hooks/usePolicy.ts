import { useWorkspaceStore } from '../store/WorkspaceStore';

export const usePolicy = () => {
  const navigation = useWorkspaceStore(state => state.navigation);
  
  // Real-time permission validation based on backend navigation payload
  const hasPermission = (featureKey: string): boolean => {
    // If the module exists in the sidebar or bottom_nav, the user has access
    const inSidebar = navigation.sidebar.some(item => item.id === featureKey);
    const inBottomNav = navigation.bottom_nav.some(item => item.id === featureKey);
    
    return inSidebar || inBottomNav;
  };

  const hasAppAccess = (appSlug: string): boolean => {
    return hasPermission(appSlug);
  };

  return {
    hasPermission,
    hasAppAccess
  };
};

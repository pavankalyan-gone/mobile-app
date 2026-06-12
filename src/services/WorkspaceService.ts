import { apiClient } from '../api/apiClient';

export interface Workspace {
  id: number;
  name: string;
  default: boolean;
}

export class WorkspaceService {
  static async getWorkspaces(): Promise<Workspace[]> {
    const response = await apiClient.get('/api/mobile/v1/workspaces');
    return response.data.workspaces;
  }

  static async switchWorkspace(workspaceId: number) {
    const response = await apiClient.post('/api/mobile/v1/workspaces/switch', {
      workspace_id: workspaceId
    });
    return response.data;
  }

  static async syncContext(workspaceId: number) {
    const response = await apiClient.post('/api/mobile/v1/sync', {
      workspace_id: workspaceId
    });
    return response.data;
  }

  static async getNavigation(workspaceId: number) {
    const response = await apiClient.get(`/api/mobile/v1/navigation?workspace_id=${workspaceId}`);
    return response.data;
  }

  static async getDashboardWidgets(workspaceId: number) {
    const response = await apiClient.get(`/api/mobile/v1/dashboard/widgets?workspace_id=${workspaceId}`);
    return response.data;
  }
}

import { apiClient } from '../api/apiClient';

export interface AppRegistryItem {
  id: number;
  app_name: string;
  app_slug: string;
  app_icon: string;
  app_type: string;
}

export class AppRegistryService {
  static async getApps(): Promise<AppRegistryItem[]> {
    const response = await apiClient.get('/api/mobile/v1/app-registry');
    return response.data.apps;
  }
}

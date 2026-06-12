import { apiClient } from '../api/apiClient';

export class AuthService {
  static async login(email: string, password: string, deviceName: string) {
    const response = await apiClient.post('/api/mobile/v1/auth/login', {
      email,
      password,
      device_name: deviceName,
    });
    return response.data;
  }

  static async refresh(refreshToken: string) {
    const response = await apiClient.post('/api/mobile/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  static async logout() {
    const response = await apiClient.post('/api/mobile/v1/auth/logout');
    return response.data;
  }
}

import { Platform } from 'react-native';

const getDevHost = () => {
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return 'localhost';
};

const DEV_HOST = getDevHost();

// Perfex CRM backend — handles leads, staff auth
export const PERFEX_API_URL = __DEV__
  ? `http://${DEV_HOST}:8000/mobile_app/api`
  : 'https://crm.concept2designs.in/mobile_app/api';

// Custom Estimator app backend — handles estimates, clients, products, reminders, device tokens
export const ESTIMATOR_API_URL = __DEV__
  ? `http://${DEV_HOST}:8001`
  : 'https://estimator.onestudio.co.in';

// Separate SecureStore keys so each backend's token is stored independently
export const PERFEX_TOKEN_KEY = 'perfex_auth_token';
export const ESTIMATOR_TOKEN_KEY = 'estimator_auth_token';

export const USER_STORAGE_KEY = 'auth_user';

// bypass token for developer easy authentication
export const DEVELOPMENT_BYPASS_TOKEN = 'k5QCB1qfJqW7DCP9KgFMuUnUsMhAkyQPAvDKQ5Le';

export const MOCK_MODE = false;


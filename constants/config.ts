import { Platform } from 'react-native';

const getDevHost = () => {
  if (Platform.OS === 'android') {
    return '10.0.2.2:8000';
  }
  return 'localhost:8000';
};

const DEV_HOST = getDevHost();

export const API_BASE_URL = __DEV__ 
  ? `http://${DEV_HOST}/mobile_app/api`
  : 'http://localhost:8000/mobile_app/api';

export const PERFEX_API_URL = API_BASE_URL;
export const ESTIMATOR_API_URL = API_BASE_URL;
export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// bypass token for developer easy authentication
export const DEVELOPMENT_BYPASS_TOKEN = 'k5QCB1qfJqW7DCP9KgFMuUnUsMhAkyQPAvDKQ5Le';

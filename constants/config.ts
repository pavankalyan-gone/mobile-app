// Perfex CRM backend — handles leads, staff auth (primary backend)
export const PERFEX_API_URL = 'https://crm.concept2designs.in/mobile_app/api';

// Custom Estimator app backend — handles estimates, clients, products, reminders, device tokens
export const ESTIMATOR_API_URL = 'https://estimator.onestudio.co.in/api';

// Separate SecureStore keys so each backend's token is stored independently
export const PERFEX_TOKEN_KEY = 'perfex_auth_token';
export const ESTIMATOR_TOKEN_KEY = 'estimator_auth_token';

export const USER_STORAGE_KEY = 'auth_user';

/**
 * Mock mode swaps the axios adapters for an in-memory mock server.
 * It can NEVER be enabled in a release build (`__DEV__` guard); in dev it is
 * on by default and can be disabled with EXPO_PUBLIC_MOCK_MODE=false.
 */
export const MOCK_MODE = __DEV__ && process.env.EXPO_PUBLIC_MOCK_MODE !== 'false';

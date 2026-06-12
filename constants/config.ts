// Perfex CRM backend — handles leads, staff auth (primary backend)
export const PERFEX_API_URL = 'https://crm.concept2designs.in/mobile_app/api';

// Separate SecureStore keys so each backend's token is stored independently
export const PERFEX_TOKEN_KEY = 'perfex_auth_token';
export const ESTIMATOR_TOKEN_KEY = 'estimator_auth_token';

export const USER_STORAGE_KEY = 'auth_user';

// Estimator App backend — handles estimates and their approvals
export const ESTIMATOR_API_URL = 'https://estimator.onestudio.co.in';

/**
 * Mock mode swaps the axios adapter for an in-memory mock server.
 * It can NEVER be enabled in a release build (`__DEV__` guard in perfexApi).
 * Flip to `true` to develop against the mock data instead of the live CRM.
 */
export const MOCK_MODE = false;

import axios from 'axios';
import * as SecureStore from '../utils/secureStore';
import { PERFEX_API_URL, PERFEX_TOKEN_KEY, MOCK_MODE } from '../constants/config';
import { authEvents } from '../utils/authEvents';

const perfexApi = axios.create({
  baseURL: PERFEX_API_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
});

if (__DEV__ && MOCK_MODE) {
  const { mockAdapter } = require('../utils/mockData');
  perfexApi.defaults.adapter = mockAdapter;
}

let csrfTokenCache: string | null = null;
let csrfCookieStr: string | null = null;

const fetchCsrfToken = async () => {
  try {
    const res = await axios.get(`${PERFEX_API_URL}/info`);
    const setCookie = res.headers['set-cookie'];
    if (setCookie) {
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const csrfCookie = cookies.find(c => c.startsWith('csrf_cookie_name='));
      if (csrfCookie) {
        csrfCookieStr = csrfCookie.split(';')[0];
        csrfTokenCache = csrfCookieStr.split('=')[1];
      }
    }
  } catch (err) {
    if (__DEV__) console.warn('Failed to fetch CSRF token:', err);
  }
};

perfexApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(PERFEX_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If method is POST/PUT/PATCH/DELETE, bypass CodeIgniter CSRF by attaching the token
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    if (!csrfTokenCache) await fetchCsrfToken();

    if (csrfTokenCache && csrfCookieStr) {
      config.headers.Cookie = config.headers.Cookie 
        ? `${config.headers.Cookie}; ${csrfCookieStr}` 
        : csrfCookieStr;
      
      const data = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      data.csrf_token_name = csrfTokenCache;
      
      const serializeParams = (obj: any, prefix?: string): string => {
        const str: string[] = [];
        for (const p in obj) {
          if (obj.hasOwnProperty(p)) {
            const k = prefix ? `${prefix}[${p}]` : p;
            const v = obj[p];
            if (v !== null && typeof v === 'object') {
              str.push(serializeParams(v, k));
            } else if (v !== undefined) {
              str.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
          }
        }
        return str.join('&');
      };
      
      // Convert to x-www-form-urlencoded so CI3 can read $_POST['csrf_token_name']
      // and properly parse nested arrays like $_POST['custom_fields']
      config.data = serializeParams(data);
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

perfexApi.interceptors.response.use(
  (response) => {
    // Update CSRF token if rotated
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const csrfCookie = cookies.find(c => c.startsWith('csrf_cookie_name='));
      if (csrfCookie) {
        csrfCookieStr = csrfCookie.split(';')[0];
        csrfTokenCache = csrfCookieStr.split('=')[1];
      }
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(PERFEX_TOKEN_KEY);
      authEvents.emitUnauthorized();
    }
    // Clear cache on 403 (e.g., 419 Page Expired mapped to 403) so we fetch a fresh one
    if (error.response?.status === 403) {
      csrfTokenCache = null;
      csrfCookieStr = null;
    }
    return Promise.reject(error);
  }
);

export default perfexApi;

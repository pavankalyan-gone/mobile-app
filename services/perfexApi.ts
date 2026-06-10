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
      
      // Custom URL encoding builder that handles nested objects/arrays for CodeIgniter
      const buildUrlEncoded = (obj: any, prefix?: string): string[] => {
        const parts: string[] = [];
        for (const p in obj) {
          if (obj.hasOwnProperty(p)) {
            const k = prefix ? `${prefix}[${p}]` : p;
            const v = obj[p];
            if (v !== null && typeof v === 'object' && !(v instanceof File) && !(v instanceof Blob)) {
              parts.push(...buildUrlEncoded(v, k));
            } else if (v !== undefined) {
              parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
            }
          }
        }
        return parts;
      };
      
      // If we're not sending actual files, x-www-form-urlencoded is safer in React Native
      // as Axios sometimes drops the boundary or body for FormData without files.
      const hasFiles = Object.values(data).some(v => v instanceof File || (v && typeof v === 'object' && (v as any).uri));
      
      if (!hasFiles) {
        config.data = buildUrlEncoded(data).join('&');
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        
        if (config.url && config.url.includes('lead_note')) {
          console.log("=== LEAD NOTE DEBUG ===");
          console.log("Original Object:", data);
          console.log("URL Encoded String:", config.data);
          console.log("Content-Type:", config.headers['Content-Type']);
          console.log("=======================");
        }
      } else {
        const formData = new FormData();
        const appendFormData = (obj: any, prefix?: string) => {
          for (const p in obj) {
            if (obj.hasOwnProperty(p)) {
              const k = prefix ? `${prefix}[${p}]` : p;
              const v = obj[p];
              if (v !== null && typeof v === 'object' && !(v instanceof File) && !(v as any).uri) {
                appendFormData(v, k);
              } else if (v !== undefined) {
                formData.append(k, v as any);
              }
            }
          }
        };
        appendFormData(data);
        config.data = formData;
        if (config.headers['Content-Type']) {
          delete config.headers['Content-Type'];
        }
        
        if (config.url && config.url.includes('lead_note')) {
          console.log("=== LEAD NOTE DEBUG (FormData) ===");
          console.log("FormData sent for:", config.url);
          console.log("=======================");
        }
      }
      
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

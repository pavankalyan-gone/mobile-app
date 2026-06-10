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
      // Drop any stale csrf cookie (e.g. on a replayed request) before attaching
      const existing = (config.headers.Cookie || '')
        .split(';')
        .map((c: string) => c.trim())
        .filter((c: string) => c && !c.startsWith('csrf_cookie_name='));
      config.headers.Cookie = [...existing, csrfCookieStr].join('; ');
      
      // The body may already be a string when a request is re-dispatched after a
      // CSRF retry (urlencoded) or was provided pre-serialized (JSON).
      let data: any;
      if (typeof config.data === 'string') {
        try {
          data = JSON.parse(config.data);
        } catch {
          data = {};
          for (const pair of config.data.split('&')) {
            if (!pair) continue;
            const eq = pair.indexOf('=');
            const k = decodeURIComponent(eq === -1 ? pair : pair.slice(0, eq));
            data[k] = eq === -1 ? '' : decodeURIComponent(pair.slice(eq + 1));
          }
        }
      } else {
        data = config.data || {};
      }
      data.csrf_token_name = csrfTokenCache;

      // `File` is not a global in React Native (Hermes) — referencing it bare
      // throws a ReferenceError inside this interceptor and rejects every POST.
      const isFileLike = (v: any): boolean =>
        (typeof File !== 'undefined' && v instanceof File) ||
        (typeof Blob !== 'undefined' && v instanceof Blob) ||
        (v && typeof v === 'object' && typeof (v as any).uri === 'string');

      // Custom URL encoding builder that handles nested objects/arrays for CodeIgniter
      const buildUrlEncoded = (obj: any, prefix?: string): string[] => {
        const parts: string[] = [];
        for (const p in obj) {
          if (obj.hasOwnProperty(p)) {
            const k = prefix ? `${prefix}[${p}]` : p;
            const v = obj[p];
            if (v !== null && typeof v === 'object' && !isFileLike(v)) {
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
      const hasFiles = Object.values(data).some(isFileLike);

      if (!hasFiles) {
        config.data = buildUrlEncoded(data).join('&');
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        const formData = new FormData();
        const appendFormData = (obj: any, prefix?: string) => {
          for (const p in obj) {
            if (obj.hasOwnProperty(p)) {
              const k = prefix ? `${prefix}[${p}]` : p;
              const v = obj[p];
              if (v !== null && typeof v === 'object' && !isFileLike(v)) {
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
    // CodeIgniter rotates the CSRF token, so a cached one can go stale and the
    // server answers 403 (419 Page Expired mapped to 403). The request was not
    // processed, so it is safe to fetch a fresh token and replay it once.
    if (error.response?.status === 403 && error.config && !error.config._csrfRetried) {
      csrfTokenCache = null;
      csrfCookieStr = null;
      error.config._csrfRetried = true;
      return perfexApi.request(error.config);
    }
    if (error.response?.status === 403) {
      csrfTokenCache = null;
      csrfCookieStr = null;
    }
    return Promise.reject(error);
  }
);

export default perfexApi;

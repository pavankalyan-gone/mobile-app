import axios from 'axios';
import * as SecureStore from '../utils/secureStore';
import { PERFEX_API_URL, SSO_ACCESS_TOKEN_KEY, PERFEX_TOKEN_KEY, MOCK_MODE } from '../constants/config';
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

// React Native can merge multiple Set-Cookie headers into a single
// comma-joined string, so search within each entry instead of relying on
// the csrf cookie being first.
const extractCsrfCookie = (setCookie: unknown): void => {
  if (!setCookie) return;
  const cookies = Array.isArray(setCookie) ? setCookie : [String(setCookie)];
  for (const c of cookies) {
    const m = String(c).match(/(?:^|[\s,;])csrf_cookie_name=([^;,\s]+)/);
    if (m) {
      csrfTokenCache = m[1];
      csrfCookieStr = `csrf_cookie_name=${m[1]}`;
    }
  }
};

const fetchCsrfToken = async () => {
  try {
    const res = await axios.get(`${PERFEX_API_URL}/info`);
    extractCsrfCookie(res.headers['set-cookie']);
  } catch (err) {
    if (__DEV__) console.warn('Failed to fetch CSRF token:', err);
  }
};

perfexApi.interceptors.request.use(async (config) => {
  let token = await SecureStore.getItemAsync(PERFEX_TOKEN_KEY);
  if (!token) {
    token = await SecureStore.getItemAsync(SSO_ACCESS_TOKEN_KEY);
  }
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
    }

    // The body may already be a string when a request is re-dispatched after a
    // CSRF/encoding retry (urlencoded) or was provided pre-serialized (JSON).
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

    // The CRM's endpoints are inconsistent about body parsing: some read
    // $_POST (form-encoded — also where CodeIgniter looks for the CSRF
    // token), others read the raw JSON body (e.g. /lead_note, which answers
    // "Description is required" to a form body). Default to form-encoded
    // when a CSRF token is available; callers can opt into JSON with
    // `_bodyEncoding: 'json'`, and a 400 triggers one retry with the other
    // encoding (see the response interceptor).
    const encoding: 'json' | 'form' | 'multipart' =
      (config as any)._bodyEncoding ?? (csrfTokenCache && csrfCookieStr ? 'form' : 'json');

    if (encoding === 'json') {
      delete data.csrf_token_name;
      if (csrfTokenCache) config.headers['X-CSRF-TOKEN'] = csrfTokenCache;
      config.headers['Content-Type'] = 'application/json';
      config.data = data;
      return config;
    }

    if (csrfTokenCache) data.csrf_token_name = csrfTokenCache;

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

    const hasFiles = Object.values(data).some(isFileLike);

    if (encoding === 'multipart' || hasFiles) {
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
    } else {
      config.data = buildUrlEncoded(data).join('&');
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

perfexApi.interceptors.response.use(
  (response) => {
    // Update CSRF token if rotated
    extractCsrfCookie(response.headers['set-cookie']);
    return response;
  },
  async (error) => {
    const cfg: any = error.config;

    if (error.response?.status === 401) {
      // Deletion is handled by the authEvents.onUnauthorized listener or authApi interceptor.
      authEvents.emitUnauthorized();
    }

    // CodeIgniter rotates the CSRF token, so a cached one can go stale and the
    // server answers 403 (419 Page Expired mapped to 403). The request was not
    // processed, so it is safe to fetch a fresh token and replay it once.
    if (error.response?.status === 403 && cfg && !cfg._csrfRetried) {
      csrfTokenCache = null;
      csrfCookieStr = null;
      cfg._csrfRetried = true;
      // A JSON body can't carry the token through $_POST — fall back to the
      // default (form when a token is available) for the replay.
      delete cfg._bodyEncoding;
      return perfexApi.request(cfg);
    }
    if (error.response?.status === 403) {
      csrfTokenCache = null;
      csrfCookieStr = null;
    }

    // Endpoints that parse only one body encoding answer 400 ("<field> is
    // required") when the fields arrive in the other. The request was
    // rejected, not processed, so retry once with the alternate encoding.
    // (Multipart bodies are excluded: config.data is FormData, not a string.)
    if (
      error.response?.status === 400 &&
      cfg && !cfg._encodingRetried &&
      cfg.method && ['post', 'put', 'patch', 'delete'].includes(cfg.method.toLowerCase()) &&
      typeof cfg.data === 'string'
    ) {
      cfg._encodingRetried = true;
      const wasJson = cfg.data.trim().startsWith('{');
      cfg._bodyEncoding = wasJson ? 'form' : 'json';
      if (__DEV__) console.warn(`Got 400 from ${cfg.url}; retrying with ${cfg._bodyEncoding}-encoded body`);
      return perfexApi.request(cfg);
    }

    return Promise.reject(error);
  }
);

export default perfexApi;

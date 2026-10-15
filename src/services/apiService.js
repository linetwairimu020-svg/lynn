function getApiBaseUrl() {
  const currentHost = window.location.hostname;
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    const url = new URL(configured, window.location.origin);
    if (['localhost', '127.0.0.1'].includes(url.hostname) && ['localhost', '127.0.0.1'].includes(currentHost)) {
      url.hostname = currentHost;
    }
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  }
  if (import.meta.env.DEV) return `${window.location.protocol}//${currentHost}:3000/api`;
  return `${window.location.origin}/api`;
}

const API_BASE_URL = getApiBaseUrl();
let csrfToken = '';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body && !(typeof FormData !== 'undefined' && options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let payload = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch {
      if (response.ok) throw new Error('The server returned an invalid response.');
    }
  }
  if (!response.ok) {
    const apiError = payload?.error;
    throw new ApiError(apiError?.message || `The server returned an error (${response.status}).`, response.status, apiError?.code);
  }
  if (typeof payload?.csrfToken === 'string') csrfToken = payload.csrfToken;
  return payload;
}

const json = (method, data) => ({ method, body: JSON.stringify(data) });
const contentName = (collection) => collection === 'socialLinks' ? 'social-links' : collection;
const collectionPath = (collection) => `/admin/${contentName(collection)}`;

async function requestWithCsrf(path, options) {
  if (!csrfToken) await request('/auth/csrf');
  return request(path, { ...options, headers: { ...options.headers, 'X-CSRF-Token': csrfToken } });
}

export const apiService = {
  auth: {
    login: (credentials) => requestWithCsrf('/auth/login', json('POST', credentials)),
    register: (details) => requestWithCsrf('/auth/register', json('POST', details)),
    logout: () => requestWithCsrf('/auth/logout', { method: 'POST' }),
    currentUser: async () => {
      try {
        return await request('/auth/me');
      } catch (error) {
        if (error.status === 401) csrfToken = '';
        throw error;
      }
    },
    csrf: () => request('/auth/csrf'),
    requestPasswordReset: (email) => request('/auth/password-reset', json('POST', { email })),
  },
  admin: {
    authorize: () => request('/admin/access'),
    overview: () => request('/admin/overview'),
    updateMessage: (id, read) => requestWithCsrf(`/admin/messages/${encodeURIComponent(id)}`, json('PATCH', { read })),
  },
  content: {
    list: (collection) => request(collectionPath(collection)),
    publicList: (collection) => request(`/content/${contentName(collection)}`),
    create: (collection, item) => requestWithCsrf(collectionPath(collection), json('POST', item)),
    update: (collection, id, item) => requestWithCsrf(`${collectionPath(collection)}/${encodeURIComponent(id)}`, json('PUT', item)),
    updateSingleton: (collection, item) => requestWithCsrf(collectionPath(collection), json('PUT', item)),
    remove: (collection, id) => requestWithCsrf(`${collectionPath(collection)}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    removeMessage: (id) => requestWithCsrf(`/admin/messages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  media: {
    uploadProjectImage: (file) => {
      const body = new FormData();
      body.append('image', file);
      return requestWithCsrf('/admin/project-images', { method: 'POST', body });
    },
  },
  messages: {
    submit: (message) => requestWithCsrf('/contact-messages', json('POST', message)),
    list: () => request('/admin/messages'),
  },
};

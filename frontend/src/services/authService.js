import { apiService } from './apiService.js';

const listeners = new Set();
let snapshot = { user: null, loading: true, error: '' };
let authGeneration = 0;

export function isBackendUnavailable(error) {
  return error instanceof Error
    && error.message === 'Could not reach the server. Check your connection and try again.';
}

function notify() {
  listeners.forEach((listener) => listener());
}

function updateSnapshot(next) {
  snapshot = next;
  notify();
}

async function loadCurrentUser() {
  const generation = ++authGeneration;
  try {
    const result = await apiService.auth.currentUser();
    if (generation === authGeneration) updateSnapshot({ user: result.user, loading: false, error: '' });
    return { user: result.user, status: 200 };
  } catch (error) {
    if (generation === authGeneration) {
      updateSnapshot({ user: null, loading: false, error: error.status === 401 ? '' : error.message });
    }
    return { user: null, status: error.status || 0, error: error.message };
  }
}

void loadCurrentUser();
window.setInterval(() => {
  if (snapshot.user) void loadCurrentUser();
}, 60_000);

export async function login(credentials) {
  const result = await apiService.auth.login(credentials);
  authGeneration++;
  updateSnapshot({ user: result.user, loading: false, error: '' });
  return result.user;
}

export async function register(details) {
  return apiService.auth.register(details);
}

export async function logout() {
  try {
    await apiService.auth.logout();
    authGeneration++;
    updateSnapshot({ user: null, loading: false, error: '' });
  } catch (error) {
    const current = await loadCurrentUser();
    if (current.status !== 401) throw error;
  }
}

export function getCurrentUser() {
  return snapshot;
}

export function subscribeToAuth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshCurrentUser() {
  return loadCurrentUser();
}

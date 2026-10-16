import { useSyncExternalStore } from 'react';
import { getCurrentUser, subscribeToAuth } from '../services/authService';

export default function useAuth() {
  return useSyncExternalStore(subscribeToAuth, getCurrentUser, () => ({ user: null, loading: true, error: '' }));
}

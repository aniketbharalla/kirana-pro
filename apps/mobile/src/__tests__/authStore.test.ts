import { useAuthStore } from '../store/authStore';
import { UserProfile } from '@kirana-pro/shared';

describe('authStore', () => {
  const mockUser: UserProfile = {
    uid: 'user_123',
    displayName: 'Ramesh Kumar',
    email: 'ramesh@example.com',
    phoneNumber: '+919876543210',
    photoURL: null,
    authProvider: 'phone',
    role: 'owner',
    storeId: 'store_456',
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z',
  };

  beforeEach(() => {
    useAuthStore.getState().clearUser();
  });

  it('initializes with user null and isAuthenticated false', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('setUser updates user and sets isAuthenticated true', () => {
    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('clearUser resets to initial state', () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().clearUser();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setLoading toggles isLoading flag', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

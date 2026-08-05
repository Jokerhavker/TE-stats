export const AUTH_TOKEN_KEY = 's8ul_auth_token';
export const USER_ROLE_KEY = 's8ul_user_role';
export const SESSION_ID_KEY = 's8ul_session_id';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
};

export const getUserRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(USER_ROLE_KEY);
};

export const setAuthSession = (token: string, role: string, sessionId?: string): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(USER_ROLE_KEY, role);
  if (sessionId) {
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
};

export const clearAuthSession = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(USER_ROLE_KEY);
  sessionStorage.removeItem(SESSION_ID_KEY);
};

export const addAuthHeaders = (headers?: HeadersInit): HeadersInit => {
  const token = getAuthToken();
  if (!token) return headers || {};
  return {
    ...(headers || {}),
    Authorization: `Bearer ${token}`,
  };
};

export const handleAuthError = (status: number): void => {
  if (status === 401 && getAuthToken()) {
    clearAuthSession();
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
  }
};

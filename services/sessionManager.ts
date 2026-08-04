import type { AdminSession } from '@/types/index';

const SESSION_TIMEOUT = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // Check activity every 5 minutes

const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`API Error (${response.status}) at ${endpoint}`);
      return null;
    }
    return await response.json();
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn(`API request failed for ${endpoint}`);
    return null;
  }
};

// ── Session Creation ──────────────────────────────────────────
export const createAdminSession = async (
  userId: string,
  userRole: 'admin' | 'ledger',
  sessionName?: string
): Promise<AdminSession | null> => {
  const defaultName = sessionName || `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Session`;

  const sessionData = {
    userId,
    userRole,
    sessionName: defaultName,
    deviceType: detectDeviceType(),
    ipAddress: 'N/A',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A'
  };

  return await apiFetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });
};

// ── Get Active Sessions ───────────────────────────────────────
export const getActiveSessions = async (userId?: string): Promise<AdminSession[]> => {
  const url = userId ? `/api/sessions?userId=${userId}` : '/api/sessions';
  const data = await apiFetch(url);
  return (data && Array.isArray(data)) ? data : [];
};

// ── Update Session Name ───────────────────────────────────────
export const updateSessionName = async (
  sessionId: string,
  newName: string
): Promise<void> => {
  await apiFetch('/api/sessions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: sessionId,
      sessionName: newName
    })
  });
};

// ── Terminate Session ─────────────────────────────────────────
export const terminateSession = async (sessionId: string): Promise<void> => {
  await apiFetch(`/api/sessions?id=${sessionId}`, {
    method: 'DELETE'
  });
};

// ── Update Last Activity ──────────────────────────────────────
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  await apiFetch('/api/sessions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: sessionId,
      lastActivityTime: Date.now()
    })
  });
};

// ── Client-side Session Storage ───────────────────────────────
export const storeSessionInBrowser = (session: AdminSession): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('s8ul_admin_session', JSON.stringify(session));
    sessionStorage.setItem('s8ul_user_role', session.userRole);
  }
};

export const getStoredSession = (): AdminSession | null => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('s8ul_admin_session');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

export const clearStoredSession = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('s8ul_admin_session');
    sessionStorage.removeItem('s8ul_user_role');
    sessionStorage.removeItem('s8ul_session_id');
  }
};

// ── Device Detection ──────────────────────────────────────────
export const detectDeviceType = (): string => {
  if (typeof window === 'undefined') return 'Unknown';

  const ua = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'Mobile';
  } else if (/ipad|tablet|kindle|playbook|silk|nexus 7|nexus 10|xoom/i.test(ua)) {
    return 'Tablet';
  }
  return 'Desktop';
};

// ── Session Validation ────────────────────────────────────────
export const isSessionValid = (session: AdminSession): boolean => {
  const now = Date.now();
  return session.isActive && session.expiresAt > now;
};

// ── Setup Activity Listener ───────────────────────────────────
export const setupActivityListener = (sessionId: string): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const updateActivity = () => {
    updateSessionActivity(sessionId);
  };

  // Update on user interactions
  window.addEventListener('mousedown', updateActivity);
  window.addEventListener('keydown', updateActivity);
  window.addEventListener('scroll', updateActivity);
  window.addEventListener('touchstart', updateActivity);

  // Periodic update to keep session alive
  const interval = setInterval(updateActivity, ACTIVITY_CHECK_INTERVAL);

  // Cleanup function
  return () => {
    window.removeEventListener('mousedown', updateActivity);
    window.removeEventListener('keydown', updateActivity);
    window.removeEventListener('scroll', updateActivity);
    window.removeEventListener('touchstart', updateActivity);
    clearInterval(interval);
  };
};

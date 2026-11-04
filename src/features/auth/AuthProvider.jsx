import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { isSessionIdle } from './sessionPolicy';
import {
  activityStorageKey, isAuthConfigured, recoveryStorageKey,
  requireSupabase, sessionStorage, sessionStorageKey, supabase,
} from '../../services/supabase';

const AuthContext = createContext(/** @type {ReturnType<typeof useAuthState> | null} */ (null));

function useAuthState() {
  const [session, setSession] = useState(/** @type {import('@supabase/supabase-js').Session | null} */ (null));
  const [loading, setLoading] = useState(isAuthConfigured);
  const [endingSession, setEndingSession] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [locked, setLocked] = useState(false);
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState('');
  const lastActivity = useRef(0);
  const lastWrite = useRef(0);
  const closing = useRef(false);

  const signOut = useCallback(async (message = '') => {
    if (closing.current) return;
    closing.current = true;
    setEndingSession(true);
    setLocked(true);
    setPreview(false);
    try {
      await sessionStorage.setItem(recoveryStorageKey, 'locked');
      const result = await supabase?.auth.signOut({ scope: 'local' });
      if (result?.error) {
        setNotice('Đã khóa phiên trên thiết bị. Chưa xác nhận được việc thu hồi phiên trên máy chủ; hãy kết nối mạng rồi đăng nhập lại.');
      } else setNotice(message);
      await sessionStorage.removeItem(sessionStorageKey);
      await sessionStorage.removeItem(activityStorageKey);
    } catch {
      setNotice('Phiên đã bị khóa. Không thể hoàn tất xóa phiên trên thiết bị; vui lòng thử đăng xuất lại khi có kết nối.');
    } finally {
      setSession(null);
      setRecovery(false);
      closing.current = false;
      setEndingSession(false);
    }
  }, []);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (session && !locked && isSessionIdle(lastActivity.current, now)) {
      void signOut('Phiên đã hết hạn sau 15 phút không hoạt động. Vui lòng đăng nhập lại.');
      return;
    }
    lastActivity.current = now;
    if (session && !locked && now - lastWrite.current > 10_000) {
      lastWrite.current = now;
      void sessionStorage.setItem(activityStorageKey, String(now)).catch(() => {
        setNotice('Không thể lưu thời điểm hoạt động. Vui lòng đăng xuất rồi đăng nhập lại.');
      });
    }
  }, [session, locked, signOut]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') { setRecovery(false); setLocked(true); setPreview(false); }
      // Keep this callback synchronous to avoid deadlocking the auth lock.
    });
    async function restoreSession() {
      try {
        const [result, marker, activity] = await Promise.all([
          requireSupabase().auth.getSession(),
          sessionStorage.getItem(recoveryStorageKey),
          sessionStorage.getItem(activityStorageKey),
        ]);
        if (!active) return;
        if (result.error) throw result.error;
        const previousActivity = Number(activity);
        const expired = Boolean(result.data.session) && isSessionIdle(previousActivity, Date.now());
        setSession(result.data.session);
        setRecovery(marker === 'recovery' && Boolean(result.data.session));
        setLocked((marker !== null && marker !== 'recovery') || expired);
        lastActivity.current = previousActivity || Date.now();
        if (expired) await signOut('Phiên đã hết hạn sau 15 phút không hoạt động. Vui lòng đăng nhập lại.');
      } catch {
        if (active) { setLocked(true); setNotice('Không thể khôi phục phiên đã lưu. Vui lòng đăng nhập lại.'); }
      } finally { if (active) setLoading(false); }
    }
    void restoreSession();
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase?.auth.startAutoRefresh();
      else supabase?.auth.stopAutoRefresh();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
      appState.remove();
      supabase?.auth.stopAutoRefresh();
    };
  }, [signOut]);

  useEffect(() => {
    if (!session || loading || locked) return;
    function checkTimeout() {
      if (isSessionIdle(lastActivity.current, Date.now())) {
        void signOut('Phiên đã hết hạn sau 15 phút không hoạt động. Vui lòng đăng nhập lại.');
      }
    }
    const timer = setInterval(checkTimeout, 5_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkTimeout();
      else void sessionStorage.setItem(activityStorageKey, String(lastActivity.current)).catch(() => {});
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [session, loading, locked, signOut]);

  /** @param {string} email @param {string} password */
  async function signIn(email, password) {
    setLocked(true);
    const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    await sessionStorage.removeItem(recoveryStorageKey);
    await sessionStorage.setItem(activityStorageKey, String(Date.now()));
    lastActivity.current = Date.now();
    setSession(data.session); setLocked(false); setRecovery(false); setPreview(false); setNotice('');
  }

  /** @param {string} email @param {string} password @param {string} name */
  async function registerAccount(email, password, name) {
    setLocked(true);
    const { data, error } = await requireSupabase().auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;
    if (data.session) {
      await signOut();
      return false;
    }
    return true;
  }

  /** @param {string} email @param {string} token */
  async function verifySignup(email, token) {
    setLocked(true);
    const { data, error } = await requireSupabase().auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    await sessionStorage.removeItem(recoveryStorageKey);
    await sessionStorage.setItem(activityStorageKey, String(Date.now()));
    lastActivity.current = Date.now();
    setSession(data.session); setLocked(false); setPreview(false); setNotice('');
  }

  /** @param {string} email @param {string} token */
  async function verifyRecovery(email, token) {
    setLocked(true);
    await sessionStorage.setItem(recoveryStorageKey, 'recovery');
    const { data, error } = await requireSupabase().auth.verifyOtp({ email, token, type: 'recovery' });
    if (error) { await sessionStorage.setItem(recoveryStorageKey, 'locked'); throw error; }
    await sessionStorage.setItem(activityStorageKey, String(Date.now()));
    lastActivity.current = Date.now();
    setSession(data.session); setRecovery(true); setLocked(false);
  }

  /** @param {string} password */
  async function updatePassword(password) {
    if (!recovery || !session) throw new Error('No recovery session');
    const { error } = await requireSupabase().auth.updateUser({ password });
    if (error) throw error;
    await signOut('Mật khẩu đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.');
  }

  return {
    session, loading, endingSession, recovery, preview, notice, isConfigured: isAuthConfigured,
    isSignedIn: Boolean(session?.user.email_confirmed_at) && !locked && !recovery,
    signIn, signOut, registerAccount, verifySignup, verifyRecovery, updatePassword, recordActivity,
    enterPreview: () => { setPreview(true); setNotice(''); },
    exitPreview: () => { setPreview(false); },
  };
}

/** @param {{ children: import('react').ReactNode }} props */
export function AuthProvider({ children }) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}

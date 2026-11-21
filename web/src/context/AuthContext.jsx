import { createContext, useContext, useEffect, useState } from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../services/authService";
import {
  getToken,
  getStoredUser,
  saveSession,
  saveUser,
  clearSession,
  setLastEmail,
  SESSION_EXPIRED_EVENT,
} from "../services/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // A stored session signs the user in immediately on page load; the token
  // is then re-validated in the background.
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [token, setToken] = useState(getToken);

  // Only block rendering when there is a token but no cached profile.
  const [loading, setLoading] = useState(() => Boolean(getToken()) && !getStoredUser());

  function startSession(response, remember) {
    saveSession(response, remember);
    setLastEmail(response.user?.email || "");
    setUser(response.user);
    setToken(response.token);
  }

  function logout() {
    clearSession();
    setUser(null);
    setToken(null);
  }

  async function login({ email, password, remember }) {
    const response = await loginUser({ email, password, remember });
    startSession(response, remember);
    return response;
  }

  async function register({ remember = true, ...payload }) {
    const response = await registerUser({ ...payload, remember });
    startSession(response, remember);
    return response;
  }

  function updateUser(nextUser) {
    saveUser(nextUser);
    setUser(nextUser);
  }

  useEffect(() => {
    let active = true;

    async function validateSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();

        if (active) {
          setUser(response.user);
          saveUser(response.user);
        }
      } catch (error) {
        // Only an explicit rejection ends the session. A network error or a
        // backend that is still waking up keeps the cached session.
        if (active && error?.response?.status === 401) {
          logout();
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, [token]);

  // Any request that comes back 401 signs the user out (see api.js).
  useEffect(() => {
    function handleExpired() {
      setUser(null);
      setToken(null);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

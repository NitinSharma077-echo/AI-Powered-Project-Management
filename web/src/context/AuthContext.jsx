import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("meetflow_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("meetflow_token") || null
  );

  const [loading, setLoading] = useState(Boolean(token));

  function saveSession(response) {
    localStorage.setItem("meetflow_user", JSON.stringify(response.user));
    localStorage.setItem("meetflow_token", response.token);

    setUser(response.user);
    setToken(response.token);
  }

  function logout() {
    localStorage.removeItem("meetflow_user");
    localStorage.removeItem("meetflow_token");
    setUser(null);
    setToken(null);
  }

  async function login(credentials) {
    const response = await loginUser(credentials);
    saveSession(response);
    return response;
  }

  async function register(payload) {
    const response = await registerUser(payload);
    saveSession(response);
    return response;
  }

  function updateUser(nextUser) {
    localStorage.setItem("meetflow_user", JSON.stringify(nextUser));
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
          localStorage.setItem("meetflow_user", JSON.stringify(response.user));
        }
      } catch (error) {
        if (active) {
          logout();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

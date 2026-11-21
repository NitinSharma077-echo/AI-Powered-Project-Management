// Where the signed-in session lives.
//
// "Keep me signed in"  -> localStorage: survives closing the browser, so the
//                         app signs the user straight back in next visit.
// Otherwise            -> sessionStorage: cleared when the tab is closed.
//
// Storage access is wrapped because it throws in some private modes.

const TOKEN_KEY = "meetflow_token";
const USER_KEY = "meetflow_user";

export const SESSION_EXPIRED_EVENT = "meetflow:session-expired";

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function stores() {
  return [
    safe(() => window.localStorage),
    safe(() => window.sessionStorage),
  ].filter(Boolean);
}

export function getToken() {
  for (const store of stores()) {
    const token = safe(() => store.getItem(TOKEN_KEY));
    if (token) return token;
  }
  return null;
}

export function getStoredUser() {
  for (const store of stores()) {
    const raw = safe(() => store.getItem(USER_KEY));
    if (raw) {
      const user = safe(() => JSON.parse(raw));
      if (user) return user;
    }
  }
  return null;
}

// True when the current session was saved with "Keep me signed in".
export function isRemembered() {
  return Boolean(safe(() => window.localStorage.getItem(TOKEN_KEY)));
}

export function saveSession({ user, token }, remember) {
  clearSession();
  const store = remember
    ? safe(() => window.localStorage)
    : safe(() => window.sessionStorage);

  if (!store) return;
  safe(() => store.setItem(TOKEN_KEY, token));
  safe(() => store.setItem(USER_KEY, JSON.stringify(user)));
}

// Update the cached user wherever the session is stored.
export function saveUser(user) {
  for (const store of stores()) {
    if (safe(() => store.getItem(TOKEN_KEY))) {
      safe(() => store.setItem(USER_KEY, JSON.stringify(user)));
    }
  }
}

export function clearSession() {
  for (const store of stores()) {
    safe(() => store.removeItem(TOKEN_KEY));
    safe(() => store.removeItem(USER_KEY));
  }
}

// Remember the last email used, so the login form can be pre-filled.
const EMAIL_KEY = "meetflow_last_email";

export function getLastEmail() {
  return safe(() => window.localStorage.getItem(EMAIL_KEY)) || "";
}

export function setLastEmail(email) {
  safe(() => window.localStorage.setItem(EMAIL_KEY, email));
}

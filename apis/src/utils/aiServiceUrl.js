// Normalize AI_SERVICE_URL so common dashboard mistakes still work:
//   " ai-x.onrender.com "         -> "https://ai-x.onrender.com"
//   "https://ai-x.onrender.com/"  -> "https://ai-x.onrender.com"
//   "https://ai-x.onrender.com/health" -> "https://ai-x.onrender.com"
function resolveAiServiceUrl(raw = process.env.AI_SERVICE_URL) {
  let value = String(raw || "").trim().replace(/^["']|["']$/g, "");

  if (!value) {
    return "http://localhost:8000";
  }

  if (!/^https?:\/\//i.test(value)) {
    // Local hosts default to http, everything else (e.g. Render) to https.
    value = /^(localhost|127\.0\.0\.1)(:|$)/i.test(value)
      ? `http://${value}`
      : `https://${value}`;
  }

  try {
    // Keep only scheme + host (+ port); drop any path such as /health.
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
}

module.exports = { resolveAiServiceUrl };

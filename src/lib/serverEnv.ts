function normalizeBaseUrl(raw: string) {
  return raw.trim().replace(/\/+$/, "");
}

export function getAiServerBaseUrl() {
  const configured = process.env.AI_SERVER_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:8000";
  }

  throw new Error("Missing AI_SERVER_URL in production environment.");
}

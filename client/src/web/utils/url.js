/** Ne renvoie l'URL que si elle est en http(s) : évite javascript: dans un href. */
export function safeHref(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

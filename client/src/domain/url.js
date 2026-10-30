/** « ude.my/abc » → « https://ude.my/abc » ; une adresse avec un protocole reste inchangée. */
export function withScheme(url) {
  if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  return `https://${url.replace(/^\/+/, '')}`;
}

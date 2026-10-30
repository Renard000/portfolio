import { Marked } from 'marked';
import DOMPurify from 'dompurify';

// Instance dédiée : aucune option globale de marked n'est modifiée.
const marked = new Marked({ gfm: true, breaks: false });

/** Markdown → HTML assaini avec DOMPurify (scripts, attributs on*, javascript: retirés). */
export default class MarkdownService {
  static render(markdown) {
    const html = marked.parse(String(markdown || ''), { async: false });
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }
}

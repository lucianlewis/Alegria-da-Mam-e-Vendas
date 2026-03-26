import DOMPurify from 'dompurify';

export function sanitizeForDisplay(raw: string): string {
  if (!raw) return '';
  // Bloqueio preventivo de padrões XSS comuns
  if (/<script|javascript:|on\w+=/i.test(raw)) {
    console.warn('[SECURITY] Input malicioso bloqueado');
    return '';
  }
  return DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

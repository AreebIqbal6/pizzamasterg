import DOMPurify from 'isomorphic-dompurify'

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Use DOMPurify for strict, industry-standard XSS sanitization
    // FORBID_ATTR removes potentially dangerous attributes like handlers (onload, onerror, etc.)
    return DOMPurify.sanitize(input.trim(), {
      USE_PROFILES: { html: false }, // Strip ALL HTML tags
    });
  } else if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  } else if (typeof input === 'object' && input !== null) {
    const sanitizedObj: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitizedObj[key] = sanitizeInput(input[key]);
      }
    }
    return sanitizedObj;
  }
  return input;
}

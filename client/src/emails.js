const EMAIL_RE = /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[^\s@,;<>()"]{2,}$/;

export const isValidEmail = (v) => EMAIL_RE.test(v.trim());

// Splits pasted text on commas, semicolons, spaces and new lines, and strips <angle brackets>
export const splitTokens = (raw) =>
  raw
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^[<"']+|[>"']+$/g, '').trim())
    .filter(Boolean);

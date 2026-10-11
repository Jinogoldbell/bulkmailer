const EMAIL_RE = /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[^\s@,;<>()"]{2,}$/;

const isValidEmail = (value) => typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);

/**
 * Accepts an array or a string separated by commas, semicolons, spaces or new lines.
 * Returns lower-cased, de-duplicated valid addresses plus any invalid entries.
 */
function parseRecipients(input) {
  const raw = Array.isArray(input) ? input : String(input || '').split(/[\s,;]+/);
  const seen = new Set();
  const valid = [];
  const invalid = [];

  for (const item of raw) {
    const email = String(item || '').trim().toLowerCase();
    if (!email) continue;
    if (!isValidEmail(email)) {
      invalid.push(email);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    valid.push(email);
  }
  return { valid, invalid };
}

module.exports = { isValidEmail, parseRecipients };



// PAN regex: 5 letters, 4 digits, 1 letter (case-insensitive)
function validatePan(pan) {
  if (!pan) return false;
  const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return re.test(String(pan).toUpperCase());
}

// Normalize mobile number to 10-digit string (or return null if invalid)
// Accept formats: 1234567890, 01234567890, +911234567890, 919123456789
function normalizeMobile(mob) {
  if (!mob) return null;
  let s = String(mob).trim();
  // remove spaces, dashes, parentheses
  s = s.replace(/\s+/g, '').replace(/[-()]/g, '');
  // remove leading + if present
  if (s.startsWith('+')) s = s.slice(1);
  // if starts with 91 and length 12 -> remove country code
  if (s.length === 12 && s.startsWith('91')) s = s.slice(2);
  // if starts with 0 and length 11 -> remove leading 0
  if (s.length === 11 && s.startsWith('0')) s = s.slice(1);
  // now must be 10 digits
  if (/^[0-9]{10}$/.test(s)) return s;
  return null;
}

// check for missing keys in request body
function checkMissingKeys(body, requiredKeys) {
  const missing = [];
  requiredKeys.forEach(k => {
    if (body[k] === undefined) missing.push(k);
  });
  return missing;
}

module.exports = {
  validatePan,
  normalizeMobile,
  checkMissingKeys
};

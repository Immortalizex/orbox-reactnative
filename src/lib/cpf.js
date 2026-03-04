/**
 * CPF helpers for Brazilian tax ID.
 * Backend performs full validation (check digits); here we only format and check length.
 */

/** Strip non-digits from CPF string. */
export function cpfDigits(value) {
  return (value || '').replace(/\D/g, '');
}

/** Format as 000.000.000-00 (max 14 chars). */
export function formatCpf(value) {
  const d = cpfDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Returns true if input has exactly 11 digits (format check only; backend validates check digits). */
export function isCpfLengthValid(value) {
  return cpfDigits(value).length === 11;
}

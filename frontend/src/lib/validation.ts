export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^(\+1 \(\d{3}\) \d{3}-\d{4}|\(\d{3}\) \d{3}-\d{4}|\d{3}-\d{3}-\d{4})$/;
// Allows letters, numbers, spaces and common business punctuation: & . , ' - ( ) / ! @ # % +
// Blocks characters that are invalid in business names or unsafe: < > { } [ ] \ ^ ~ ` = | $ *
export const COMPANY_NAME_RE = /^[a-zA-Z0-9 &.,'\-()/!@#%+]+$/;
export const MAX_COMPANY_NAME = 200;
export const PHONE_ERROR_MSG = "Use format: +1 (XXX) XXX-XXXX, (XXX) XXX-XXXX, or XXX-XXX-XXXX";
export const EMAIL_ERROR_MSG = "Enter a valid email address.";
export const COMPANY_NAME_ERROR_MSG = "Company name contains unsupported characters. Allowed: letters, numbers, and & . , ' - ( ) / ! @ # % +";

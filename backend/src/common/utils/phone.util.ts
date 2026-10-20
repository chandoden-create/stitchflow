import { BadRequestException } from '@nestjs/common';

/**
 * Normalize a phone number to E.164 format.
 * - Strips spaces, dashes, dots, parentheses
 * - Ensures a + prefix
 * - Validates the result matches E.164 pattern
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit and non-plus characters
  let cleaned = phone.replace(/[\s\-.()\[\]]/g, '');

  // Handle Indian shorthand like 09876543210 → +919876543210
  if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = '+91' + cleaned.slice(1);
  }

  // Handle standard 10-digit Indian numbers without country code: 9876543210 → +919876543210
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  if (!isValidE164(cleaned)) {
    throw new BadRequestException(
      `Phone number '${phone}' is not a valid E.164 number. Expected format: +919876543210`,
    );
  }

  return cleaned;
}

/**
 * Validate E.164 format: + followed by 7–15 digits.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Format a phone for display (Indian numbers): +91-98765-43210
 */
export function formatPhoneForDisplay(phone: string): string {
  if (phone.startsWith('+91') && phone.length === 13) {
    const local = phone.slice(3);
    return `+91-${local.slice(0, 5)}-${local.slice(5)}`;
  }
  return phone;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  let normalized = digits;

  if (normalized.startsWith('0')) {
    normalized = '+61' + normalized.slice(1);
  } else if (!normalized.startsWith('+61')) {
    normalized = '+61' + normalized;
  }

  if (/^\+614\d{8}$/.test(normalized)) {
    return normalized.replace(/^(\+61)(4\d{2})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
  }

  if (/^\+61[2378]\d{8}$/.test(normalized)) {
    return normalized.replace(/^(\+61)([2378])(\d{4})(\d{4})$/, '$1 $2 $3 $4');
  }

  return normalized;
}
/**
 * Form validation helpers
 */

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return undefined;
}

export function validateUsername(username: string): string | undefined {
  if (!username.trim()) return 'Username is required';
  if (username.length < 4) return 'Username must be at least 4 characters';
  if (username.length > 10) return 'Username must be at most 10 characters';
  return undefined;
}

export function validateRequired(value: string, fieldName: string): string | undefined {
  if (!value.trim()) return `${fieldName} is required`;
  return undefined;
}

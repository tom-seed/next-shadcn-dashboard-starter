// File: src/lib/audits/base.ts

export function countIf(condition: boolean, current = 0): number {
  return condition ? current + 1 : current;
}

export function isMissing(value: any): boolean {
  return !value || (typeof value === 'string' && value.trim() === '');
}

export function isMultiple(values: any): boolean {
  return Array.isArray(values) && values.length > 1;
}

export function isDuplicate(values: any): boolean {
  return Array.isArray(values) && new Set(values).size < values.length;
}

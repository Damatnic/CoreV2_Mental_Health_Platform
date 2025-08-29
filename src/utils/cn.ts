/**
 * A utility function for joining classnames conditionally
 * Similar to clsx or classnames libraries but lightweight
 */

type ClassValue = string | number | boolean | undefined | null | { [key: string]: unknown } | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter((x) => {
      if (typeof x === 'string') return x.length > 0;
      if (typeof x === 'number') return true;
      if (typeof x === 'boolean') return x;
      if (typeof x === 'object' && x !== null) {
        return Object.entries(x).some(([, value]) => Boolean(value));
      }
      return false;
    })
    .map((x) => {
      if (typeof x === 'string' || typeof x === 'number') return String(x);
      if (typeof x === 'object' && x !== null) {
        return Object.entries(x)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default cn;

export const isDev = __DEV__;

export function devLog(label: string, payload?: unknown) {
  if (!isDev) return;
  if (payload !== undefined) {
    console.log(`[design-on-a-dime] ${label}`, payload);
  } else {
    console.log(`[design-on-a-dime] ${label}`);
  }
}

export function devError(label: string, error: unknown) {
  if (!isDev) return;
  console.error(`[design-on-a-dime] ${label}`, error);
}

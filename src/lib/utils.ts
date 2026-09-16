// Lightweight cn() utility — merges class names and handles conditional logic
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

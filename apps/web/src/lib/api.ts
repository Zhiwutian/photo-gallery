export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (base && base.length > 0) {
    return `${base.replace(/\/+$/, "")}${path}`;
  }
  return path;
}

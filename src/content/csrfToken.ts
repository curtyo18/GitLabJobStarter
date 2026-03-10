export function readCsrfToken(): string | null {
  return (
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
      ?.content ?? null
  );
}

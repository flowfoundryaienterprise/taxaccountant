export function validConvexUrl(raw: string | undefined): raw is string {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}

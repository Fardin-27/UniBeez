const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : import.meta.env.VITE_API_URL || "";

export function getImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const normalizedPath = path.replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.indexOf("/uploads/");

  if (uploadsIndex !== -1) {
    const relativeUploadsPath = normalizedPath.slice(uploadsIndex);
    return `${API_URL}${relativeUploadsPath}`;
  }

  if (normalizedPath.startsWith("uploads/")) {
    return `${API_URL}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/")) {
    return `${API_URL}${normalizedPath}`;
  }

  return `${API_URL}/${normalizedPath}`;
}

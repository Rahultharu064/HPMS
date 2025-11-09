export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export function buildMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (typeof pathOrUrl !== 'string') return ''
  // Handle backslashes from Windows paths and normalize to forward slashes
  const normalizedPath = pathOrUrl.replace(/\\/g, '/').replace(/^\/+/, '')
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE_URL}/${normalizedPath}`
}

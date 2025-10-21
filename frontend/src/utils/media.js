export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export function buildMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (typeof pathOrUrl !== 'string') return ''
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE_URL}/${pathOrUrl.replace(/^\/+/, '')}`
}

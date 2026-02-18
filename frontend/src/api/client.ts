import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
})

export function posterSrc(url: string | null | undefined): string {
  if (!url) return 'https://via.placeholder.com/300x450?text=Movie'
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return url
}

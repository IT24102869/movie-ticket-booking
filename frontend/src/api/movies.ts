import { api } from './client'
import type { Movie, Showtime } from './types'

export type MovieInput = {
  title: string
  description?: string | null
  duration_mins: number
  language?: string | null
  genre?: string | null
  poster_url?: string | null
  release_date?: string | null
}

export async function addMovie(payload: MovieInput): Promise<Movie> {
  const { data } = await api.post<Movie>('/movies', payload)
  return data
}

export async function fetchMovies(): Promise<Movie[]> {
  const { data } = await api.get<Movie[]>('/movies')
  return data
}

export async function fetchMovie(movieId: number): Promise<Movie> {
  const { data } = await api.get<Movie>(`/movies/${movieId}`)
  return data
}

export async function updateMovie(movieId: number, payload: MovieInput): Promise<Movie> {
  const { data } = await api.put<Movie>(`/movies/${movieId}`, payload)
  return data
}

export async function deleteMovie(movieId: number): Promise<void> {
  await api.delete(`/movies/${movieId}`)
}

export async function fetchShowtimes(movieId: number, date: string): Promise<Showtime[]> {
  const { data } = await api.get<Showtime[]>(`/movies/${movieId}/showtimes`, { params: { date } })
  return data
}

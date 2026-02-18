import { api } from './client'

export async function rateMovie(movieId: number, score: number) {
  const { data } = await api.post('/ratings', { movie_id: movieId, score })
  return data
}

export async function fetchMyRatings() {
  const { data } = await api.get('/ratings/me')
  return data
}

export async function fetchMyRatingForMovie(movieId: number) {
  const { data } = await api.get(`/ratings/movie/${movieId}`)
  return data
}

export async function fetchMovieStats(movieId: number): Promise<{ movie_id: number; avg_score: number; count: number }> {
  const { data } = await api.get(`/ratings/movie/${movieId}/stats`)
  return data
}

export async function deleteRating(movieId: number) {
  const { data } = await api.delete(`/ratings/movie/${movieId}`)
  return data
}

export async function fetchRecommendations(limit = 10) {
  const { data } = await api.get('/ratings/recommendations', { params: { limit } })
  return data
}

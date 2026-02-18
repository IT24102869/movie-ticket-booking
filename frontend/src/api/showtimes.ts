import { api } from './client'
import type { Screen, SeatMap, Showtime } from './types'

export type ShowtimeInput = {
  movie_id: number
  screen_id: number
  start_time: string
  price: number
}

export async function createShowtime(payload: ShowtimeInput): Promise<Showtime> {
  const { data } = await api.post<Showtime>('/showtimes', payload)
  return data
}

export async function fetchScreens(): Promise<Screen[]> {
  const { data } = await api.get<Screen[]>('/showtimes/screens')
  return data
}

export async function fetchSeatMap(showtimeId: number): Promise<SeatMap> {
  const { data } = await api.get<SeatMap>(`/showtimes/${showtimeId}/seats`)
  return data
}

export async function lockSeats(showtimeId: number, seatIds: number[]): Promise<{ showtime_id: number; locked_seat_ids: number[]; lock_ttl_seconds: number }> {
  const { data } = await api.post(`/showtimes/${showtimeId}/lock-seats`, { seat_ids: seatIds })
  return data
}

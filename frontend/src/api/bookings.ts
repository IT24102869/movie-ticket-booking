import { api } from './client'
import type { Booking } from './types'

export async function createBooking(showtimeId: number, seatIds: number[]): Promise<Booking> {
  const { data } = await api.post<Booking>('/bookings', { showtime_id: showtimeId, seat_ids: seatIds })
  return data
}

export async function fetchMyBookings(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>('/bookings/me')
  return data
}

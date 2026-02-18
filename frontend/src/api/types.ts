export type Movie = {
  id: number
  title: string
  description?: string | null
  duration_mins: number
  language?: string | null
  genre?: string | null
  poster_url?: string | null
  release_date?: string | null
}

export type Theater = {
  id: number
  name: string
  city: string
  address?: string | null
}

export type Screen = {
  id: number
  theater_id: number
  name: string
  total_rows: number
  total_cols: number
  theater?: Theater | null
}

export type Showtime = {
  id: number
  movie_id: number
  screen_id: number
  start_time: string
  end_time: string
  price: string
  screen?: Screen | null
}

export type Seat = {
  id: number
  screen_id: number
  seat_row: string
  seat_col: number
  seat_type: string
}

export type ShowtimeSeat = {
  seat: Seat
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED'
  locked_until?: string | null
}

export type SeatMap = {
  showtime_id: number
  screen: Screen
  seats: ShowtimeSeat[]
  price: string
  start_time: string
  end_time: string
  movie: Movie
}

export type Booking = {
  id: number
  user_id: number
  showtime: Showtime
  movie: Movie
  status: string
  total_amount: string
  created_at: string
  seats: { seat: Seat }[]
}

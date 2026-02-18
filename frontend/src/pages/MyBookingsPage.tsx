import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMyBookings } from '../api/bookings'
import { posterSrc } from '../api/client'

export default function MyBookingsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['mybookings'], queryFn: fetchMyBookings })

  if (isLoading) return <div className="section">Loading bookings…</div>
  if (error) return <div className="section">Failed to load bookings.</div>

  const bookings = data ?? []

  return (
    <>
      <h1 className="h1">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="section">No bookings yet. Pick a movie and book some seats!</div>
      ) : (
        <div className="booking-list">
          {bookings.map(b => {
            const movie = b.movie
            const startDate = new Date(b.showtime.start_time)
            const dateStr = startDate.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
            const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const seats = b.seats.map(s => `${s.seat.seat_row}${s.seat.seat_col}`).join(', ')
            const seatCount = b.seats.length
            const pricePerSeat = Number(b.showtime.price)
            const totalAmount = Number(b.total_amount)
            const theater = b.showtime.screen?.theater?.name ?? ''
            const theaterCity = b.showtime.screen?.theater?.city ?? ''
            const screen = b.showtime.screen?.name ?? ''
            const isConfirmed = b.status === 'CONFIRMED'

            return (
              <div key={b.id} className="booking-card">
                <div className="booking-card-left">
                  <img
                    src={posterSrc(movie?.poster_url)}
                    alt={movie?.title ?? 'Movie'}
                    className="booking-poster"
                  />
                </div>

                <div className="booking-card-right">
                  <div className="booking-card-top">
                    <div style={{flex: 1, minWidth: 0}}>
                      <div className="booking-movie-title">{movie?.title ?? 'Unknown Movie'}</div>
                      <div className="booking-meta">
                        {movie?.genre && <span className="badge">{movie.genre}</span>}
                        {movie?.language && <span className="badge">{movie.language}</span>}
                        {movie?.duration_mins && <span className="badge">{movie.duration_mins} mins</span>}
                      </div>
                    </div>
                    <div className="booking-id-badge">
                      <span className={`booking-status ${isConfirmed ? 'confirmed' : 'cancelled'}`}>
                        {b.status}
                      </span>
                      <span className="booking-id">#{b.id}</span>
                    </div>
                  </div>

                  <div className="booking-divider" />

                  <div className="booking-details-grid">
                    <div className="booking-detail-item">
                      <span className="booking-detail-label">Date</span>
                      <span className="booking-detail-value">{dateStr}</span>
                    </div>
                    <div className="booking-detail-item">
                      <span className="booking-detail-label">Time</span>
                      <span className="booking-detail-value">{timeStr}</span>
                    </div>
                    <div className="booking-detail-item">
                      <span className="booking-detail-label">Theater</span>
                      <span className="booking-detail-value">{theater}{theaterCity ? `, ${theaterCity}` : ''}</span>
                    </div>
                    <div className="booking-detail-item">
                      <span className="booking-detail-label">Screen</span>
                      <span className="booking-detail-value">{screen}</span>
                    </div>
                    <div className="booking-detail-item">
                      <span className="booking-detail-label">Seats</span>
                      <span className="booking-detail-value">{seats}</span>
                    </div>
                    <div className="booking-detail-item">
                      <span className="booking-detail-label">Booked on</span>
                      <span className="booking-detail-value">{new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="booking-divider" />

                  <div className="booking-price-section">
                    <div className="booking-price-line">
                      <span>{seatCount} seat{seatCount !== 1 ? 's' : ''} &times; Rs {pricePerSeat.toFixed(2)}</span>
                      <span>Rs {(seatCount * pricePerSeat).toFixed(2)}</span>
                    </div>
                    <div className="booking-price-total">
                      <span>Total</span>
                      <span className="booking-total-amount">Rs {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

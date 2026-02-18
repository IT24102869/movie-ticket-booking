import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSeatMap } from '../api/showtimes'
import { lockSeats } from '../api/showtimes'
import { createBooking } from '../api/bookings'
import { posterSrc } from '../api/client'
import type { Booking, ShowtimeSeat } from '../api/types'

function sortSeats(a: ShowtimeSeat, b: ShowtimeSeat) {
  if (a.seat.seat_row === b.seat.seat_row) return a.seat.seat_col - b.seat.seat_col
  return a.seat.seat_row.localeCompare(b.seat.seat_row)
}

export default function SeatSelectionPage() {
  const params = useParams()
  const showtimeId = Number(params.id)
  const qc = useQueryClient()
  const nav = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['seatmap', showtimeId],
    queryFn: () => fetchSeatMap(showtimeId),
    enabled: Number.isFinite(showtimeId),
    refetchInterval: 5000,
  })

  const [selected, setSelected] = useState<number[]>([])
  const [ticket, setTicket] = useState<Booking | null>(null)
  const seats = (data?.seats ?? []).slice().sort(sortSeats)

  const grouped = useMemo(() => {
    const m = new Map<string, ShowtimeSeat[]>()
    for (const s of seats) {
      const key = s.seat.seat_row
      m.set(key, [...(m.get(key) ?? []), s])
    }
    return Array.from(m.entries()).sort((a,b)=>a[0].localeCompare(b[0]))
  }, [seats])

  const lockMutation = useMutation({
    mutationFn: (seatIds: number[]) => lockSeats(showtimeId, seatIds),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['seatmap', showtimeId] })
    }
  })

  const bookMutation = useMutation({
    mutationFn: (seatIds: number[]) => createBooking(showtimeId, seatIds),
    onSuccess: async (booking: Booking) => {
      await qc.invalidateQueries({ queryKey: ['seatmap', showtimeId] })
      await qc.invalidateQueries({ queryKey: ['mybookings'] })
      setTicket(booking)
      setSelected([])
    }
  })

  function toggleSeat(seatId: number, status: ShowtimeSeat['status']) {
    if (status !== 'AVAILABLE') return
    setSelected(prev => prev.includes(seatId) ? prev.filter(x => x !== seatId) : [...prev, seatId])
  }

  const selectedSeats = useMemo(() => {
    const set = new Set(selected)
    return seats.filter(s => set.has(s.seat.id))
  }, [seats, selected])

  const pricePerSeat = data ? Number(data.price) : 0
  const totalPrice = selectedSeats.length * pricePerSeat

  if (isLoading) return <div className="section">Loading seats…</div>
  if (error || !data) return <div className="section">Failed to load seats.</div>

  const theater = data.screen.theater
  const screen = data.screen
  const movie = data.movie

  if (ticket) {
    const ticketSeats = ticket.seats.map(s => `${s.seat.seat_row}${s.seat.seat_col}`).join(', ')
    const ticketDate = new Date(ticket.showtime.start_time)
    const dateStr = ticketDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const timeStr = ticketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
      <div className="ticket-overlay">
        <div className="ticket-card">
          <div className="ticket-header">
            <div className="ticket-check">&#10003;</div>
            <h2 className="ticket-title">Booking Confirmed!</h2>
            <p className="ticket-subtitle">Booking #{ticket.id}</p>
          </div>

          <div className="ticket-body">
            <div className="ticket-poster-wrap">
              <img
                src={posterSrc(movie.poster_url)}
                alt={movie.title}
                className="ticket-poster"
              />
            </div>

            <div className="ticket-info">
              <h3 className="ticket-movie-title">{movie.title}</h3>

              <div className="ticket-meta-row">
                {movie.genre && <span className="badge">{movie.genre}</span>}
                {movie.language && <span className="badge">{movie.language}</span>}
                <span className="badge">{movie.duration_mins} mins</span>
              </div>

              <div className="ticket-divider" />

              <div className="ticket-details">
                <div className="ticket-detail">
                  <span className="ticket-label">Date</span>
                  <span className="ticket-value">{dateStr}</span>
                </div>
                <div className="ticket-detail">
                  <span className="ticket-label">Time</span>
                  <span className="ticket-value">{timeStr}</span>
                </div>
                <div className="ticket-detail">
                  <span className="ticket-label">Screen</span>
                  <span className="ticket-value">{ticket.showtime.screen?.name}{theater ? ` • ${theater.name}` : ''}</span>
                </div>
                <div className="ticket-detail">
                  <span className="ticket-label">Seats</span>
                  <span className="ticket-value">{ticketSeats}</span>
                </div>
                <div className="ticket-detail">
                  <span className="ticket-label">Seats Count</span>
                  <span className="ticket-value">{ticket.seats.length}</span>
                </div>
                <div className="ticket-detail">
                  <span className="ticket-label">Price / Seat</span>
                  <span className="ticket-value">Rs {Number(ticket.showtime.price).toFixed(2)}</span>
                </div>
              </div>

              <div className="ticket-divider" />

              <div className="ticket-total-row">
                <span className="ticket-total-label">Total</span>
                <span className="ticket-total-amount">Rs {Number(ticket.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="ticket-actions">
            <button className="btn ticket-btn-secondary" onClick={() => setTicket(null)}>
              Book More Seats
            </button>
            <button className="btn ticket-btn-primary" onClick={() => nav('/bookings')}>
              View My Bookings
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div>
          <h1 className="h1">Select Seats</h1>
          <div className="small" style={{opacity:0.85}}>
            {movie.title} &bull; {theater ? `${theater.name} • ${theater.city} • ` : ''}{screen.name}
          </div>
        </div>
        <button className="btn" onClick={()=>qc.invalidateQueries({ queryKey: ['seatmap', showtimeId] })}>
          Refresh
        </button>
      </div>

      <div className="section">
        <div className="legend">
          <div className="legendItem"><span className="dot available" /> Available</div>
          <div className="legendItem"><span className="dot locked" /> Locked</div>
          <div className="legendItem"><span className="dot booked" /> Booked</div>
          <div className="legendItem"><span className="dot selected" /> Selected</div>
        </div>

        <div className="seatgrid" style={{marginTop: 14}}>
          {grouped.map(([row, rowSeats]) => (
            <div key={row} className="seatrow">
              <div style={{width: 24, fontWeight: 700}}>{row}</div>
              {rowSeats.map(s => {
                const isSelected = selected.includes(s.seat.id)
                const cls =
                  s.status === 'AVAILABLE' ? 'available' :
                  s.status === 'LOCKED' ? 'locked' : 'booked'
                const cls2 = isSelected ? 'selected' : ''
                return (
                  <div
                    key={s.seat.id}
                    className={`seat ${cls} ${cls2}`}
                    title={`${s.seat.seat_row}${s.seat.seat_col} • ${s.status}`}
                    onClick={() => toggleSeat(s.seat.id, s.status)}
                  >
                    {s.seat.seat_col}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="row" style={{justifyContent:'space-between', alignItems:'flex-start'}}>
          <div style={{flex: 1}}>
            <div className="h2">Summary</div>
            <div className="small" style={{marginTop: 4}}>
              Selected: {selectedSeats.map(s => `${s.seat.seat_row}${s.seat.seat_col}`).join(', ') || '—'}
            </div>

            <div className="price-breakdown" style={{marginTop: 10}}>
              <div className="price-row">
                <span>{selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}</span>
                <span>&times; Rs {pricePerSeat.toFixed(2)}</span>
              </div>
              <div className="price-total-row">
                <span>Total</span>
                <span className="price-total">Rs {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="row">
            <button
              className="btn"
              disabled={selected.length === 0 || lockMutation.isPending}
              onClick={() => lockMutation.mutate(selected)}
            >
              {lockMutation.isPending ? 'Locking…' : 'Lock seats'}
            </button>

            <button
              className="btn confirm-btn"
              disabled={selected.length === 0 || bookMutation.isPending}
              onClick={() => bookMutation.mutate(selected)}
            >
              {bookMutation.isPending ? 'Booking…' : `Confirm booking • Rs ${totalPrice.toFixed(2)}`}
            </button>
          </div>
        </div>

        {(lockMutation.error as any)?.response?.data?.detail && (
          <div className="small" style={{marginTop: 10, opacity: 0.9}}>
            Lock error: {(lockMutation.error as any).response.data.detail}
          </div>
        )}
        {(bookMutation.error as any)?.response?.data?.detail && (
          <div className="small" style={{marginTop: 10, opacity: 0.9}}>
            Booking error: {(bookMutation.error as any).response.data.detail}
          </div>
        )}

        <div className="small" style={{marginTop: 10, opacity: 0.75}}>
          Tip: seat locks expire automatically after TTL (default 5 minutes).
        </div>
      </div>
    </>
  )
}

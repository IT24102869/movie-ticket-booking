import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMovie } from '../api/movies'
import { fetchScreens, createShowtime } from '../api/showtimes'
import { posterSrc } from '../api/client'

function defaultDateTime() {
  const d = new Date()
  d.setHours(d.getHours() + 2, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ScheduleShowtimePage() {
  const { movieId } = useParams()
  const mid = Number(movieId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const movieQ = useQuery({ queryKey: ['movie', mid], queryFn: () => fetchMovie(mid), enabled: Number.isFinite(mid) })
  const screensQ = useQuery({ queryKey: ['screens'], queryFn: fetchScreens })

  const [screenId, setScreenId] = useState<number | ''>('')
  const [startTime, setStartTime] = useState(defaultDateTime())
  const [price, setPrice] = useState(12)

  const mutation = useMutation({
    mutationFn: createShowtime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showtimes'] })
      navigate(`/movies/${mid}`)
    },
  })

  const movie = movieQ.data
  const screens = screensQ.data ?? []

  if (movieQ.isLoading || screensQ.isLoading) return <div className="section">Loading…</div>
  if (!movie) return <div className="section">Movie not found.</div>

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!screenId) return
    mutation.mutate({
      movie_id: mid,
      screen_id: Number(screenId),
      start_time: new Date(startTime).toISOString(),
      price,
    })
  }

  return (
    <>
      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        <img
          src={posterSrc(movie.poster_url)}
          alt={movie.title}
          style={{ width: 140, height: 210, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)' }}
        />
        <div style={{ flex: 1 }}>
          <h1 className="h1" style={{ marginBottom: 4 }}>Schedule Showtime</h1>
          <div className="small" style={{ opacity: 0.8, marginBottom: 6 }}>
            {movie.title} • {movie.duration_mins} mins
          </div>

          <form onSubmit={handleSubmit} className="section" style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="small" style={{ fontWeight: 600 }}>Screen *</span>
                {screens.length === 0 ? (
                  <div className="small" style={{ color: '#f44336' }}>
                    No screens available. Seed data first: <code>POST /admin/seed</code>
                  </div>
                ) : (
                  <select
                    className="input"
                    required
                    value={screenId}
                    onChange={e => setScreenId(Number(e.target.value))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="">Select a screen…</option>
                    {screens.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.theater?.name ? `${s.theater.name} – ` : ''}{s.name} ({s.total_rows * s.total_cols} seats)
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="small" style={{ fontWeight: 600 }}>Start Time *</span>
                <input
                  className="input"
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                <span className="small" style={{ opacity: 0.6 }}>
                  End time auto-calculated: {startTime && movie.duration_mins
                    ? new Date(new Date(startTime).getTime() + movie.duration_mins * 60000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : '—'}
                </span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="small" style={{ fontWeight: 600 }}>Ticket Price ($) *</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={0.5}
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  style={{ width: 160, boxSizing: 'border-box' }}
                />
              </label>

              {mutation.isError && (
                <div style={{ color: '#f44336', fontSize: 14 }}>
                  {(mutation.error as Error)?.message ?? 'Failed to schedule showtime.'}
                </div>
              )}

              <div className="row" style={{ marginTop: 4 }}>
                <button className="btn" type="submit" disabled={mutation.isPending || screens.length === 0}
                  style={{ background: 'rgba(76,175,80,0.22)', borderColor: 'rgba(76,175,80,0.5)' }}>
                  {mutation.isPending ? 'Saving…' : 'Schedule Showtime'}
                </button>
                <Link to={`/movies/${mid}`} className="btn">Cancel</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

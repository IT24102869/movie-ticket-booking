import React, { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMovie, fetchShowtimes } from '../api/movies'
import { posterSrc } from '../api/client'
import { rateMovie, fetchMyRatingForMovie, fetchMovieStats } from '../api/ratings'

function yyyyMmDd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function StarRating({ movieId }: { movieId: number }) {
  const qc = useQueryClient()
  const [hover, setHover] = useState(0)
  const myRatingQ = useQuery({ queryKey: ['myrating', movieId], queryFn: () => fetchMyRatingForMovie(movieId) })
  const statsQ = useQuery({ queryKey: ['moviestats', movieId], queryFn: () => fetchMovieStats(movieId) })
  const mutation = useMutation({
    mutationFn: (score: number) => rateMovie(movieId, score),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myrating', movieId] })
      qc.invalidateQueries({ queryKey: ['moviestats', movieId] })
      qc.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  const myScore = myRatingQ.data?.score ?? 0
  const stats = statsQ.data
  const active = hover || myScore

  return (
    <div className="rating-widget">
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className={`rating-star ${star <= active ? 'filled' : ''}`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => mutation.mutate(star)}
            disabled={mutation.isPending}
          >
            ★
          </button>
        ))}
        <span className="rating-label">
          {myScore > 0 ? `Your rating: ${myScore}/5` : 'Rate this movie'}
        </span>
      </div>
      {stats && stats.count > 0 && (
        <div className="rating-avg">
          <span style={{ color: '#ffc107', fontSize: 16 }}>★</span>
          <span style={{ fontWeight: 700 }}>{stats.avg_score.toFixed(1)}</span>
          <span className="small" style={{ opacity: 0.6 }}>({stats.count} rating{stats.count === 1 ? '' : 's'})</span>
        </div>
      )}
    </div>
  )
}

export default function ShowPage() {
  const params = useParams()
  const movieId = Number(params.id)
  const [date, setDate] = useState(yyyyMmDd(new Date()))

  const movieQ = useQuery({ queryKey: ['movie', movieId], queryFn: () => fetchMovie(movieId), enabled: Number.isFinite(movieId) })
  const showtimesQ = useQuery({ queryKey: ['showtimes', movieId, date], queryFn: () => fetchShowtimes(movieId, date), enabled: Number.isFinite(movieId) })

  const movie = movieQ.data
  const showtimes = showtimesQ.data ?? []

  const theaterName = useMemo(() => showtimes[0]?.screen?.theater?.name, [showtimes])

  if (movieQ.isLoading) return <div className="section">Loading…</div>
  if (movieQ.error || !movie) return <div className="section">Movie not found.</div>

  return (
    <>
      <div className="row" style={{gap: 16, alignItems:'flex-start'}}>
        <img
          src={posterSrc(movie.poster_url)}
          alt={movie.title}
          style={{width: 220, height: 330, objectFit:'cover', borderRadius: 16, border:'1px solid rgba(255,255,255,0.10)'}}
        />
        <div style={{flex: 1}}>
          <h1 className="h1" style={{marginBottom: 8}}>{movie.title}</h1>
          <div className="row" style={{marginBottom: 10}}>
            {movie.genre && <span className="badge">{movie.genre}</span>}
            {movie.language && <span className="badge">{movie.language}</span>}
            <span className="badge">{movie.duration_mins} mins</span>
          </div>
          <StarRating movieId={movieId} />
          <div className="small" style={{lineHeight: 1.45, opacity: 0.9, marginTop: 10}}>
            {movie.description ?? 'No description.'}
          </div>

          <div className="section" style={{marginTop: 14}}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <div>
                <div className="h2">Showtimes</div>
                <div className="small" style={{opacity: 0.8}}>
                  {theaterName ? `${theaterName} • ` : ''}Pick a time, then choose seats
                </div>
              </div>
            <div className="row" style={{gap: 8}}>
                <input className="input" type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
                <Link to={`/movies/${movieId}/schedule`} className="btn" style={{fontSize: 13, background:'rgba(33,150,243,0.18)', borderColor:'rgba(33,150,243,0.45)'}}>
                  + Schedule
                </Link>
              </div>

            </div>

            {showtimesQ.isLoading ? (
              <div className="small" style={{marginTop: 10}}>Loading showtimes…</div>
            ) : showtimesQ.error ? (
              <div className="small" style={{marginTop: 10}}>Failed to load showtimes.</div>
            ) : showtimes.length === 0 ? (
              <div className="small" style={{marginTop: 10}}>No showtimes for this date.</div>
            ) : (
              <div className="row" style={{marginTop: 12}}>
                {showtimes.map(st => {
                  const start = new Date(st.start_time)
                  const label = start.toLocaleString([], { hour: '2-digit', minute: '2-digit' })
                  return (
                    <Link key={st.id} to={`/showtimes/${st.id}/seats`} className="btn">
                      {label} • Rs {st.price}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="small" style={{marginTop: 12, opacity: 0.8}}>
            <Link to="/">← Back to movies</Link>
          </div>
        </div>
      </div>
    </>
  )
}

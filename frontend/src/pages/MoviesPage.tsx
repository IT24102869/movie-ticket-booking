import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovies } from '../api/movies'
import { posterSrc } from '../api/client'
import { Link } from 'react-router-dom'

export default function MoviesPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['movies'], queryFn: fetchMovies })
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const qq = q.trim().toLowerCase()
    if (!qq) return data
    return data.filter(m => m.title.toLowerCase().includes(qq) || (m.genre ?? '').toLowerCase().includes(qq))
  }, [data, q])

  if (isLoading) return <div className="section">Loading movies…</div>
  if (error) return <div className="section">Failed to load movies. Make sure backend is running and seeded.</div>

  return (
    <>
      <div className="row" style={{justifyContent:'space-between'}}>
        <h1 className="h1">Movies</h1>
        <input className="input" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search title / genre…" />
      </div>

      <div className="cardgrid">
        {filtered.map(movie => (
          <div key={movie.id} className="card">
            <Link to={`/movies/${movie.id}`}>
              <img src={posterSrc(movie.poster_url)} alt={movie.title} />
            </Link>
            <div className="cardbody">
              <Link to={`/movies/${movie.id}`} style={{fontWeight: 700}}>{movie.title}</Link>
              <div className="row">
                {movie.genre && <span className="badge">{movie.genre}</span>}
                {movie.language && <span className="badge">{movie.language}</span>}
                <span className="badge">{movie.duration_mins} mins</span>
              </div>
              <div className="small" style={{opacity:0.8, lineHeight:1.35}}>
                {(movie.description ?? '').slice(0, 90)}{(movie.description ?? '').length > 90 ? '…' : ''}
              </div>
              <Link to={`/movies/${movie.id}/show`} className="btn" style={{marginTop: 6, textAlign:'center', background:'rgba(76,175,80,0.22)', borderColor:'rgba(76,175,80,0.5)', fontWeight: 600, fontSize: 13}}>
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

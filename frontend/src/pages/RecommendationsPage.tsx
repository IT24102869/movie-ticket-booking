import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRecommendations, fetchMyRatings } from '../api/ratings'
import { posterSrc } from '../api/client'
import { Link } from 'react-router-dom'
import type { Movie } from '../api/types'

type Recommendation = { movie: Movie; predicted_score: number }
type MyRating = { id: number; user_id: number; movie_id: number; score: number; movie: Movie }

export default function RecommendationsPage() {
  const recsQ = useQuery<Recommendation[]>({
    queryKey: ['recommendations'],
    queryFn: () => fetchRecommendations(20),
  })

  const ratingsQ = useQuery<MyRating[]>({
    queryKey: ['myratings'],
    queryFn: fetchMyRatings,
  })

  const recs = recsQ.data ?? []
  const ratings = ratingsQ.data ?? []
  const isLoading = recsQ.isLoading || ratingsQ.isLoading
  const error = recsQ.error || ratingsQ.error

  if (isLoading) return <div className="section">Analyzing your taste...</div>
  if (error) return <div className="section">Failed to load recommendations. Make sure backend is running and seeded.</div>

  return (
    <>
      {/* My Ratings */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="h1">My Ratings</h1>
        <div className="small" style={{ opacity: 0.6, marginTop: 4, marginBottom: 14 }}>
          Movies you've rated — these feed the recommendation engine
        </div>

        {ratings.length === 0 ? (
          <div className="section" style={{ textAlign: 'center', padding: 30 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No ratings yet</div>
            <div className="small">
              Go to a movie and rate it 1–5 stars to start getting recommendations.{' '}
              <Link to="/" style={{ color: '#64b5f6' }}>Browse movies</Link>
            </div>
          </div>
        ) : (
          <div className="rated-grid">
            {ratings.map(r => (
              <Link key={r.id} to={`/movies/${r.movie_id}`} className="rated-card">
                <img
                  src={posterSrc(r.movie.poster_url)}
                  alt={r.movie.title}
                  className="rated-poster"
                />
                <div className="rated-body">
                  <div className="rated-title">{r.movie.title}</div>
                  <div className="rated-stars-row">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} style={{ color: s <= r.score ? '#ffc107' : 'rgba(255,255,255,0.15)', fontSize: 16 }}>★</span>
                    ))}
                  </div>
                  {r.movie.genre && <span className="badge" style={{ fontSize: 11 }}>{r.movie.genre}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <h1 className="h1">For You</h1>
        <div className="small" style={{ opacity: 0.6, marginTop: 4 }}>
          Personalized picks powered by collaborative filtering (SVD)
        </div>

        {recs.length === 0 ? (
          <div className="section" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No recommendations yet</div>
            <div className="small">
              Rate a few movies to get personalized suggestions.{' '}
              <Link to="/" style={{ color: '#64b5f6' }}>Browse movies</Link>
            </div>
          </div>
        ) : (
          <div className="rec-list">
            {recs.map((rec, i) => (
              <div key={rec.movie.id} className="rec-card">
                <div className="rec-rank">#{i + 1}</div>
                <Link to={`/movies/${rec.movie.id}`} className="rec-poster-wrap">
                  <img
                    src={posterSrc(rec.movie.poster_url)}
                    alt={rec.movie.title}
                    className="rec-poster"
                  />
                </Link>
                <div className="rec-info">
                  <Link to={`/movies/${rec.movie.id}`} className="rec-title">
                    {rec.movie.title}
                  </Link>
                  <div className="row" style={{ gap: 6 }}>
                    {rec.movie.genre && <span className="badge">{rec.movie.genre}</span>}
                    {rec.movie.language && <span className="badge">{rec.movie.language}</span>}
                    <span className="badge">{rec.movie.duration_mins} mins</span>
                  </div>
                  <div className="small" style={{ lineHeight: 1.4, opacity: 0.75 }}>
                    {(rec.movie.description ?? '').slice(0, 120)}
                    {(rec.movie.description ?? '').length > 120 ? '...' : ''}
                  </div>
                </div>
                <div className="rec-score-wrap">
                  <div className="rec-score-ring">
                    <span className="rec-score-star">★</span>
                    <span className="rec-score-value">{rec.predicted_score.toFixed(1)}</span>
                  </div>
                  <div className="rec-score-label">predicted</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

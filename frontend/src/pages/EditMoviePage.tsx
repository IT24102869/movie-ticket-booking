import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchMovie, updateMovie, deleteMovie, type MovieInput } from '../api/movies'
import { api, posterSrc } from '../api/client'

export default function EditMoviePage() {
  const params = useParams()
  const movieId = Number(params.id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const movieQ = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => fetchMovie(movieId),
    enabled: Number.isFinite(movieId),
  })

  const [form, setForm] = useState<MovieInput | null>(null)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (movieQ.data && !form) {
      const m = movieQ.data
      setForm({
        title: m.title,
        description: m.description ?? '',
        duration_mins: m.duration_mins,
        language: m.language ?? '',
        genre: m.genre ?? '',
        poster_url: m.poster_url ?? '',
        release_date: m.release_date ?? '',
      })
    }
  }, [movieQ.data, form])

  const editMutation = useMutation({
    mutationFn: (payload: MovieInput) => updateMovie(movieId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      queryClient.invalidateQueries({ queryKey: ['movie', movieId] })
      navigate(`/movies/${movieId}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMovie(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      navigate('/')
    },
  })

  function set<K extends keyof MovieInput>(key: K, value: MovieInput[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPosterFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPosterPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPosterPreview(null)
    }
  }

  function removePoster() {
    setPosterFile(null)
    setPosterPreview(null)
    set('poster_url', '')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return

    let posterUrl: string | null = form.poster_url || null

    if (posterFile) {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', posterFile)
        const { data } = await api.post<{ url: string }>('/uploads', fd)
        posterUrl = data.url
      } catch {
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const payload: MovieInput = {
      ...form,
      description: form.description || null,
      language: form.language || null,
      genre: form.genre || null,
      poster_url: posterUrl,
      release_date: form.release_date || null,
    }
    editMutation.mutate(payload)
  }

  if (movieQ.isLoading) return <div className="section">Loading…</div>
  if (movieQ.error || !movieQ.data) return <div className="section">Movie not found.</div>
  if (!form) return <div className="section">Loading…</div>

  const busy = uploading || editMutation.isPending
  const existingPoster = movieQ.data.poster_url

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="h1">Edit Movie</h1>
        <button
          className="btn"
          style={{ color: '#f44336', borderColor: 'rgba(244,67,54,0.4)' }}
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Movie
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="section" style={{ marginTop: 12, borderColor: 'rgba(244,67,54,0.3)', background: 'rgba(244,67,54,0.08)' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Delete this movie?</div>
          <div className="small" style={{ marginBottom: 10 }}>
            This will permanently remove "{movieQ.data.title}" and cannot be undone.
          </div>
          <div className="row">
            <button
              className="btn"
              style={{ background: 'rgba(244,67,54,0.22)', borderColor: 'rgba(244,67,54,0.5)', color: '#f44336', fontWeight: 600 }}
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
            </button>
            <button className="btn" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
          {deleteMutation.isError && (
            <div style={{ color: '#f44336', fontSize: 13, marginTop: 8 }}>
              {(deleteMutation.error as Error)?.message ?? 'Failed to delete movie.'}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="section" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="small" style={{ fontWeight: 600 }}>Title *</span>
            <input
              className="input"
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. The Dark Knight"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="small" style={{ fontWeight: 600 }}>Description</span>
            <textarea
              className="input"
              rows={3}
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief plot summary…"
              style={{ resize: 'vertical' }}
            />
          </label>

          <div className="row">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span className="small" style={{ fontWeight: 600 }}>Duration (mins) *</span>
              <input
                className="input"
                type="number"
                min={1}
                required
                value={form.duration_mins}
                onChange={e => set('duration_mins', Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span className="small" style={{ fontWeight: 600 }}>Language</span>
              <input
                className="input"
                value={form.language ?? ''}
                onChange={e => set('language', e.target.value)}
                placeholder="e.g. English"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </label>
          </div>

          <div className="row">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span className="small" style={{ fontWeight: 600 }}>Genre</span>
              <input
                className="input"
                value={form.genre ?? ''}
                onChange={e => set('genre', e.target.value)}
                placeholder="e.g. Action, Sci-Fi"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span className="small" style={{ fontWeight: 600 }}>Release Date</span>
              <input
                className="input"
                type="date"
                value={form.release_date ?? ''}
                onChange={e => set('release_date', e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="small" style={{ fontWeight: 600 }}>Poster Image</span>

            {(posterPreview || (existingPoster && !posterFile && form.poster_url)) && (
              <div>
                <img
                  src={posterPreview ?? posterSrc(existingPoster)}
                  alt="Poster preview"
                  style={{ maxHeight: 200, borderRadius: 10, objectFit: 'cover' }}
                />
              </div>
            )}

            <div className="row" style={{ gap: 10 }}>
              <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {posterFile || existingPoster ? 'Change Photo' : 'Choose Photo'}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              {(posterFile || form.poster_url) && (
                <button type="button" className="btn" onClick={removePoster}
                  style={{ color: '#f44336', borderColor: 'rgba(244,67,54,0.4)' }}>
                  Remove
                </button>
              )}
            </div>
            {posterFile && (
              <span className="small" style={{ opacity: 0.7 }}>{posterFile.name} ({(posterFile.size / 1024).toFixed(0)} KB)</span>
            )}
          </div>

          {editMutation.isError && (
            <div style={{ color: '#f44336', fontSize: 14 }}>
              {(editMutation.error as Error)?.message ?? 'Failed to update movie.'}
            </div>
          )}

          <div className="row" style={{ marginTop: 4 }}>
            <button className="btn" type="submit" disabled={busy}
              style={{ background: 'rgba(76, 175, 80, 0.22)', borderColor: 'rgba(76, 175, 80, 0.5)' }}>
              {uploading ? 'Uploading…' : editMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="btn" type="button" onClick={() => navigate(`/movies/${movieId}`)}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

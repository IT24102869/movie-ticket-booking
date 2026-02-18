import React, { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { addMovie, type MovieInput } from '../api/movies'
import { api } from '../api/client'

const INITIAL: MovieInput = {
  title: '',
  description: '',
  duration_mins: 90,
  language: '',
  genre: '',
  poster_url: '',
  release_date: '',
}

export default function AddMoviePage() {
  const [form, setForm] = useState<MovieInput>({ ...INITIAL })
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: addMovie,
    onSuccess: (movie) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      navigate(`/movies/${movie.id}`)
    },
  })

  function set<K extends keyof MovieInput>(key: K, value: MovieInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
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
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let posterUrl: string | null = null

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
    mutation.mutate(payload)
  }

  const busy = uploading || mutation.isPending

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="h1">Add Movie</h1>
      </div>

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
            <div className="row" style={{ gap: 10 }}>
              <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {posterFile ? 'Change Photo' : 'Choose Photo'}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              {posterFile && (
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

          {posterPreview && (
            <div>
              <img
                src={posterPreview}
                alt="Poster preview"
                style={{ maxHeight: 200, borderRadius: 10, objectFit: 'cover' }}
              />
            </div>
          )}

          {mutation.isError && (
            <div style={{ color: '#f44336', fontSize: 14 }}>
              {(mutation.error as Error)?.message ?? 'Failed to add movie.'}
            </div>
          )}

          <div className="row" style={{ marginTop: 4 }}>
            <button className="btn" type="submit" disabled={busy}
              style={{ background: 'rgba(76, 175, 80, 0.22)', borderColor: 'rgba(76, 175, 80, 0.5)' }}>
              {uploading ? 'Uploading…' : mutation.isPending ? 'Saving…' : 'Add Movie'}
            </button>
            <button className="btn" type="button" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

import { useRef, useState } from 'react'
import { uploadAvatar } from '../utils/authService'
import { useAuth } from '../context/AuthContext'

export default function AvatarUpload() {
  const { user, setUser } = useAuth()
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const avatarUrl = await uploadAvatar(file)
      setUser(u => ({ ...u, avatar: avatarUrl }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--clr-surface-2)',
          border: '2px solid var(--clr-primary)',
          overflow: 'hidden', cursor: 'pointer', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Click to change profile picture"
      >
        {user?.avatar
          ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '2rem' }}>👤</span>
        }
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 20, height: 20, border: '2px solid #fff',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)' }}>
        {loading ? 'Uploading...' : 'Click to change photo'}
      </span>
      {error && <span style={{ fontSize: '0.75rem', color: '#ff6b6b' }}>{error}</span>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

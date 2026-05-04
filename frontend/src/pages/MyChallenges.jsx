import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

export default function MyChallenges() {
  const [challenges, setChallenges] = useState([])
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch('/api/challenges/mine/')
      .then(r => r.json())
      .then(data => setChallenges(data))
  }, [])

  async function deleteChallenge(id) {
    if (!confirm('Delete this challenge?')) return
    await apiFetch(`/api/challenges/${id}/delete/`, { method: 'DELETE' })
    setChallenges(challenges.filter(c => c.id !== id))
    setMessage('Challenge deleted')
  }

  return (
    <div className="room" style={{ justifyContent: 'flex-start', paddingTop: '100px', overflowY: 'auto', minHeight: '100vh' }}>
      <div className="level-display">MY CHALLENGES</div>

      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="page-title" style={{ fontSize: '24px', margin: 0 }}>MY CHALLENGES</div>
          <button className="primary" onClick={() => navigate('/builder')}>+ NEW</button>
        </div>

        {message && <div className="message success" style={{ marginBottom: '16px' }}>{message}</div>}

        {challenges.length === 0 && (
          <div className="message">You haven't created any challenges yet.</div>
        )}

        {challenges.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: '12px' }}>
            <div className="card-title">{c.title}</div>
            <div className="card-meta">{c.puzzles?.length || 0} puzzles</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => navigate(`/game/${c.id}`)}>PLAY</button>
              <button onClick={() => navigate(`/leaderboard/${c.id}`)}>LEADERBOARD</button>
              <button className="danger" onClick={() => deleteChallenge(c.id)}>DELETE</button>
            </div>
          </div>
        ))}

        <button onClick={() => navigate('/challenges')} style={{ marginTop: '16px' }}>
          BACK
        </button>
      </div>
    </div>
  )
}
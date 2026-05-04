import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const navigate = useNavigate()

  async function handleRegister() {
    if (!username.trim() || !password.trim()) {
      setMessage('Please fill in all fields')
      setMessageType('error')
      return
    }
    if (password !== password2) {
      setMessage('Passwords do not match')
      setMessageType('error')
      return
    }

    const res = await fetch('http://127.0.0.1:8000/api/users/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()

    if (res.ok) {
      setMessage('Account created! Redirecting to login...')
      setMessageType('success')
      setTimeout(() => navigate('/'), 1500)
    } else {
      setMessage(data.username?.[0] || data.password?.[0] || 'Registration failed')
      setMessageType('error')
    }
  }

  return (
    <div className="room">
      <div className="ui" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="page-title" style={{ fontSize: '28px' }}>CREATE ACCOUNT</div>
        <div className="page-subtitle">JOIN THE ESCAPE</div>

        <input
          placeholder="username..."
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ width: '100%' }}
        />
        <input
          type="password"
          placeholder="password..."
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%' }}
        />
        <input
          type="password"
          placeholder="confirm password..."
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRegister()}
          style={{ width: '100%' }}
        />

        <button className="primary" onClick={handleRegister} style={{ width: '100%' }}>
          REGISTER
        </button>
        <button onClick={() => navigate('/')} style={{ width: '100%' }}>
          BACK TO LOGIN
        </button>

        {message && <div className={`message ${messageType}`}>{message}</div>}
      </div>
    </div>
  )
}
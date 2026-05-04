import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'


export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  

  async function handleLogin() {
    const data = await login(username, password)
    if (data.access) {
      navigate('/challenges')
    } else {
      setMessage('Wrong username or password')
    }
  }

  return (
    <div className="room">
      <div className="ui">
        <input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleLogin}>LOG IN</button>
        <div id="message" className={message ? 'error' : ''}>{message}</div>
        <button onClick={() => navigate('/register')} style={{ width: '100%' }}>CREATE ACCOUNT</button>
      </div>
    </div>
  )
}
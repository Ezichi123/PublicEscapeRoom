import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import ChallengeList from './pages/ChallengeList'
import Game from './pages/Game'
import Leaderboard from './pages/Leaderboard'
import Builder from './pages/Builder'
import MyChallenges from './pages/MyChallenges'
import Profile from './pages/Profile'
import Register from './pages/Register'
import UserProfile from './pages/UserProfile'



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/challenges" element={<ChallengeList />} />
        <Route path="/game/:challengeId" element={<Game />} />
        <Route path="/leaderboard/:challengeId" element={<Leaderboard />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/my-challenges" element={<MyChallenges />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user/:username" element={<UserProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

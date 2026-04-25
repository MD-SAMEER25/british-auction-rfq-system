import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => date.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })

  const formatTime = (date) => date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  })

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <h1>GoComet RFQ</h1>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            All Auctions
          </NavLink>
          <NavLink to="/create" className={({ isActive }) => isActive ? 'active' : ''}>
            + Create RFQ
          </NavLink>
        </div>

        {/* Live Clock */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          background: 'rgba(0,229,255,0.05)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: '10px',
          padding: '8px 14px',
          minWidth: '170px'
        }}>
          {/* Time */}
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '16px',
            background: 'linear-gradient(90deg, #00e5ff, #fff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px',
            lineHeight: 1.2
          }}>
            {formatTime(time)}
          </div>
          {/* Date */}
          <div style={{
            fontSize: '11px',
            color: 'var(--text2)',
            marginTop: '2px',
            letterSpacing: '0.3px'
          }}>
            {formatDate(time)}
          </div>
        </div>

      </div>
    </nav>
  )
}

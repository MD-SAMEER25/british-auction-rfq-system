import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function AuctionList() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAuctions()
    const interval = setInterval(fetchAuctions, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAuctions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auctions')
      setAuctions(res.data)
    } catch (err) {
      console.error('Error fetching auctions')
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: auctions.length,
    active: auctions.filter(a => a.status === 'active').length,
    closed: auctions.filter(a => a.status !== 'active').length,
    bids: auctions.reduce((sum, a) => sum + (a.bid_count || 0), 0)
  }

  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="badge badge-active">Active</span>
    if (status === 'force_closed') return <span className="badge badge-force">Force Closed</span>
    return <span className="badge badge-closed">Closed</span>
  }

  const formatTime = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="container">

      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <div className="live-tag">
          <span className="live-dot"></span>
          Live Platform
        </div>
        <div className="page-title">British Auction<br/>RFQ System</div>
        <div className="page-subtitle">Real-time competitive bidding · Auto-extension · Lowest price wins</div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-label">Total Auctions</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.active}</div>
          <div className="stat-label">Active Now</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.bids}</div>
          <div className="stat-label">Total Bids</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.closed}</div>
          <div className="stat-label">Closed</div>
        </div>
      </div>

      {/* Table */}
      <div className="section-header">
        <div className="section-title">Live Auctions</div>
        <button className="add-btn" onClick={() => navigate('/create')}>＋ New RFQ</button>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="spinner"></div>
        ) : auctions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">⚡</span>
            <div className="empty-text">No auctions yet</div>
            <div className="empty-sub">Create your first RFQ to get started</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>RFQ</th>
                <th>Lowest Bid (₹)</th>
                <th>Bid Close</th>
                <th>Forced Close</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="rfq-name">{a.rfq_name}</div>
                    <div className="ref-id">{a.reference_id}</div>
                  </td>
                  <td>
                    {a.lowest_bid
                      ? <span className="price-val">₹{Number(a.lowest_bid).toLocaleString()}</span>
                      : <span className="no-bids">No bids yet</span>
                    }
                  </td>
                  <td style={{ fontSize: 13 }}>{formatTime(a.current_bid_close)}</td>
                  <td style={{ fontSize: 13 }}>{formatTime(a.forced_close)}</td>
                  <td>{getStatusBadge(a.status)}</td>
                  <td>
                    <button className="view-btn" onClick={() => navigate(`/auction/${a.id}`)}>
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'

export default function AuctionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [bidForm, setBidForm] = useState({
    carrier_name: '',
    freight_charges: '',
    origin_charges: '',
    destination_charges: '',
    transit_time: '',
    quote_validity: ''
  })
  const [bidMsg, setBidMsg] = useState('')
  const [bidError, setBidError] = useState('')
  const [countdown, setCountdown] = useState('')
  const fetchInterval = useRef(null)
  const timerInterval = useRef(null)

  useEffect(() => {
    fetchDetail()
    // Only one interval — fetch every 15 seconds
    fetchInterval.current = setInterval(fetchDetail, 15000)
    return () => {
      clearInterval(fetchInterval.current)
      clearInterval(timerInterval.current)
    }
  }, [])

  useEffect(() => {
    if (!data) return
    // Clear old timer
    clearInterval(timerInterval.current)
    // Start countdown timer
    timerInterval.current = setInterval(() => {
      const now = new Date()
      const close = new Date(data.auction.current_bid_close)
      const diff = close - now
      if (diff <= 0) {
        setCountdown('⏰ Closed')
        clearInterval(timerInterval.current)
        fetchDetail() // refresh once when timer hits zero
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`⏱ ${h > 0 ? h + 'h ' : ''}${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(timerInterval.current)
  }, [data])

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/auction/${id}`)
      setData(res.data)
    } catch (err) {
      console.error('Error fetching detail')
    }
  }

  const submitBid = async () => {
    setBidError('')
    setBidMsg('')
    if (!bidForm.carrier_name || !bidForm.freight_charges) {
      setBidError('Carrier name and freight charges are required!')
      return
    }
    try {
      const res = await axios.post('http://localhost:5000/api/bid', {
        auction_id: parseInt(id),
        carrier_name: bidForm.carrier_name,
        freight_charges: bidForm.freight_charges,
        origin_charges: bidForm.origin_charges,
        destination_charges: bidForm.destination_charges,
        transit_time: bidForm.transit_time,
        quote_validity: bidForm.quote_validity
      })
      setBidMsg(`🏆 Bid submitted! Your rank: L${res.data.rank}`)
      setBidForm({
        carrier_name: '', freight_charges: '',
        origin_charges: '', destination_charges: '',
        transit_time: '', quote_validity: ''
      })
      fetchDetail()
    } catch (err) {
      setBidError(err.response?.data?.error || 'Error submitting bid')
    }
  }

  const formatTime = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-badge rank-1'
    if (rank === 2) return 'rank-badge rank-2'
    if (rank === 3) return 'rank-badge rank-3'
    return 'rank-badge'
  }

  // ✅ Smart status — checks both DB status AND current time
  const getStatusBadge = () => {
    if (!data) return null
    const { auction } = data
    const isExpired = new Date() > new Date(auction.current_bid_close)
    if (auction.status === 'force_closed')
      return <span className="badge badge-force">Force Closed</span>
    if (auction.status === 'closed' || isExpired)
      return <span className="badge badge-closed">Closed</span>
    return <span className="badge badge-active">Active</span>
  }

  const isAuctionOpen = () => {
    if (!data) return false
    const { auction } = data
    const isExpired = new Date() > new Date(auction.current_bid_close)
    return auction.status === 'active' && !isExpired
  }

  const extCount = data?.logs?.filter(l => l.event_type === 'time_extended').length || 0

  if (!data) return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div className="spinner"></div>
    </div>
  )

  const { auction, bids, logs } = data

  return (
    <div className="container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Auctions</button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div className="page-title" style={{ fontSize: 32, marginBottom: 10 }}>
            {auction.rfq_name}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="ref-id">{auction.rfq_name}</span>
            {getStatusBadge()}
            {isAuctionOpen() && (
              <span className="countdown">{countdown}</span>
            )}
            {!isAuctionOpen() && countdown === '⏰ Closed' && (
              <span className="countdown">⏰ Closed</span>
            )}
          </div>
        </div>
        {/* ✅ Only show Submit Bid when auction is truly open */}
        {isAuctionOpen() && (
          <button className="btn btn-success" onClick={() => setShowModal(true)}>
            + Submit Bid
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="detail-grid">
        <div className="detail-box">
          <div className="label">Lowest Bid</div>
          <div className="value">
            {bids.length > 0 ? `₹${Number(bids[0].total).toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="detail-box">
          <div className="label">Current Bid Close</div>
          <div className="value" style={{ fontSize: 14 }}>
            {formatTime(auction.current_bid_close)}
          </div>
        </div>
        <div className="detail-box">
          <div className="label">Forced Close</div>
          <div className="value" style={{ fontSize: 14 }}>
            {formatTime(auction.forced_close)}
          </div>
        </div>
        <div className="detail-box">
          <div className="label">Total Bids</div>
          <div className="value">{bids.length}</div>
        </div>
        <div className="detail-box">
          <div className="label">Time Extensions</div>
          <div className="value">{extCount}</div>
        </div>
        <div className="detail-box">
          <div className="label">Trigger / Extension</div>
          <div className="value">
            {auction.trigger_window_mins}m / +{auction.extension_duration_mins}m
          </div>
        </div>
      </div>

      {/* Bids Table */}
      <div className="section-header">
        <div className="section-title">Supplier Rankings</div>
      </div>
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        {bids.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏷️</span>
            <div className="empty-text">No bids yet</div>
            <div className="empty-sub">Be the first supplier to submit a bid!</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Carrier</th>
                <th>Freight (₹)</th>
                <th>Origin (₹)</th>
                <th>Destination (₹)</th>
                <th>Total (₹)</th>
                <th>Transit</th>
                <th>Quote Valid Till</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {bids.map(b => (
                <tr key={b.id}>
                  <td>
                    <span className={getRankClass(b.rank)}>L{b.rank}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.carrier_name}</td>
                  <td>₹{Number(b.freight_charges).toLocaleString()}</td>
                  <td>₹{Number(b.origin_charges).toLocaleString()}</td>
                  <td>₹{Number(b.destination_charges).toLocaleString()}</td>
                  <td>
                    <span className="price-val">₹{Number(b.total).toLocaleString()}</span>
                  </td>
                  <td>{b.transit_time} days</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {b.quote_validity ? formatTime(b.quote_validity) : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {formatTime(b.submitted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Activity Log */}
      <div className="section-header">
        <div className="section-title">Activity Log</div>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <div className="empty-text">No activity yet</div>
          <div className="empty-sub">Activity will appear here when bids are submitted or time is extended</div>
        </div>
      ) : (
        logs.map((log, i) => (
          <div className="log-item" key={i}>
            <div className="log-icon">
              {log.event_type === 'time_extended' ? '⏰' : '📋'}
            </div>
            <div>
              <div className="log-type">
                {log.event_type === 'time_extended' ? 'Time Extended' : log.event_type}
              </div>
              <div className="log-reason">{log.reason}</div>
              {log.old_close && (
                <div className="log-reason" style={{ marginTop: 2 }}>
                  {formatTime(log.old_close)} → {formatTime(log.new_close)}
                </div>
              )}
              <div className="log-time">{formatTime(log.created_at)}</div>
            </div>
          </div>
        ))
      )}

      {/* Bid Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Submit Your Bid</h2>
            <div className="modal-sub">Enter your best price to compete in this auction</div>

            {bidError && <div className="error-msg">⚠️ {bidError}</div>}
            {bidMsg && <div className="success-msg">{bidMsg}</div>}

            <div className="form-group">
              <label>Carrier Name *</label>
              <input
                placeholder="e.g. BlueDart Logistics"
                value={bidForm.carrier_name}
                onChange={e => setBidForm({ ...bidForm, carrier_name: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Freight Charges (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 25000"
                  value={bidForm.freight_charges}
                  onChange={e => setBidForm({ ...bidForm, freight_charges: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Origin Charges (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={bidForm.origin_charges}
                  onChange={e => setBidForm({ ...bidForm, origin_charges: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Destination Charges (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={bidForm.destination_charges}
                  onChange={e => setBidForm({ ...bidForm, destination_charges: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Transit Time (days)</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={bidForm.transit_time}
                  onChange={e => setBidForm({ ...bidForm, transit_time: e.target.value })}
                />
              </div>
            </div>

            {/* ✅ Quote Validity Field */}
            <div className="form-group">
              <label>Quote Validity Date</label>
              <input
                type="datetime-local"
                value={bidForm.quote_validity}
                onChange={e => setBidForm({ ...bidForm, quote_validity: e.target.value })}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowModal(false)
                  setBidError('')
                  setBidMsg('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                style={{ flex: 2 }}
                onClick={submitBid}
              >
                🚀 Submit Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

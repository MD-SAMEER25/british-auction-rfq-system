import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function CreateRFQ() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', reference_id: '', bid_start: '', bid_close: '',
    forced_close: '', pickup_date: '', trigger_window_mins: 10,
    extension_duration_mins: 5, extension_trigger: 'any_bid'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!form.name || !form.reference_id || !form.bid_start || !form.bid_close || !form.forced_close) {
      setError('Please fill all required fields!')
      return
    }
    if (new Date(form.forced_close) <= new Date(form.bid_close)) {
      setError('Forced close time must be AFTER bid close time!')
      return
    }
    setLoading(true)
    try {
      await axios.post('http://localhost:5000/api/rfq', form)
      setSuccess('🎉 RFQ Created Successfully! Redirecting...')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Auctions</button>

      <div className="form-card">
        <div className="page-title" style={{ fontSize: 26, marginBottom: 6 }}>Create New RFQ</div>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 32 }}>
          Set up a British Auction for supplier bidding
        </p>

        {error && <div className="error-msg">⚠️ {error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <div className="form-section-title">Basic Information</div>

        <div className="form-row">
          <div className="form-group">
            <label>RFQ Name *</label>
            <input name="name" placeholder="e.g. Chennai to Delhi Shipment"
              value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Reference ID *</label>
            <input name="reference_id" placeholder="e.g. RFQ-2024-001"
              value={form.reference_id} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Bid Start Date & Time *</label>
            <input type="datetime-local" name="bid_start"
              value={form.bid_start} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Bid Close Date & Time *</label>
            <input type="datetime-local" name="bid_close"
              value={form.bid_close} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>⚡ Forced Close Time *</label>
            <input type="datetime-local" name="forced_close"
              value={form.forced_close} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Pickup / Service Date</label>
            <input type="datetime-local" name="pickup_date"
              value={form.pickup_date} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section-title">Auction Configuration</div>

        <div className="form-row">
          <div className="form-group">
            <label>Trigger Window (X minutes)</label>
            <input type="number" name="trigger_window_mins"
              value={form.trigger_window_mins} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Extension Duration (Y minutes)</label>
            <input type="number" name="extension_duration_mins"
              value={form.extension_duration_mins} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Extension Trigger Rule</label>
          <select name="extension_trigger" value={form.extension_trigger} onChange={handleChange}>
            <option value="any_bid">Any bid received in last X mins</option>
            <option value="any_rank_change">Any supplier rank change in last X mins</option>
            <option value="l1_rank_change">Lowest bidder (L1) rank change in last X mins</option>
          </select>
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Creating...' : '🚀 Launch Auction'}
        </button>
      </div>
    </div>
  )
}

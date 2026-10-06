import { useEffect, useState } from 'react'
const API_BASE = 'http://localhost:4000/api'
export default function CustomerDetails({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`${API_BASE}/customers/${customerId}`)
        if (!res.ok) throw new Error('Failed to fetch customer')
        const data = await res.json()
        setCustomer(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomer()
  }, [customerId])
  if (loading) {
    return (
      <div className="drawer-overlay">
        <div className="customer-drawer">
          <p>Loading customer...</p>
        </div>
      </div>
    )
  }
  if (!customer) return null
  const risk = customer.churnProbability * 100
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="customer-drawer"
        onClick={e => e.stopPropagation()}
      >
        <button className="drawer-close" onClick={onClose}>
          ×
        </button>
        <p className="drawer-eyebrow">CUSTOMER PROFILE</p>
        <h2>{customer.customerRef}</h2>
        <div className={`drawer-risk ${customer.riskLevel?.toLowerCase()}`}>
          <span>{customer.riskLevel} Risk</span>
          <strong>{risk.toFixed(1)}%</strong>
          <small>Churn probability</small>
        </div>
        <section className="detail-section">
          <h3>Customer Information</h3>
          <div className="detail-grid">
            <div>
              <span>Tenure</span>
              <strong>{customer.tenure} months</strong>
            </div>
            <div>
              <span>Contract</span>
              <strong>{customer.contract}</strong>
            </div>
            <div>
              <span>Monthly Charges</span>
              <strong>${customer.monthlyCharges?.toFixed(2)}</strong>
            </div>
            <div>
              <span>Total Charges</span>
              <strong>${customer.totalCharges?.toFixed(2)}</strong>
            </div>
            <div>
              <span>Payment Method</span>
              <strong>{customer.paymentMethod}</strong>
            </div>
            <div>
              <span>Internet Service</span>
              <strong>{customer.internetService}</strong>
            </div>
          </div>
        </section>
        <section className="detail-section">
          <h3>Services</h3>
          <div className="service-list">
            <span>Online Security</span>
            <b>{customer.onlineSecurity}</b>
            <span>Online Backup</span>
            <b>{customer.onlineBackup}</b>
            <span>Tech Support</span>
            <b>{customer.techSupport}</b>
            <span>Device Protection</span>
            <b>{customer.deviceProtection}</b>
            <span>Streaming TV</span>
            <b>{customer.streamingTV}</b>
            <span>Streaming Movies</span>
            <b>{customer.streamingMovies}</b>
          </div>
        </section>
        <section className="risk-insight">
          <span>⚠</span>
          <div>
            <h3>Risk Assessment</h3>
            <p>
              This customer has a{' '}
              <strong>{risk.toFixed(1)}%</strong> predicted
              probability of churn.
            </p>
          </div>
        </section>
        <button className="simulator-btn">
          Open What-if Simulator →
        </button>
      </aside>
    </div>
  )
}
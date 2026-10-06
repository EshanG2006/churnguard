import { useEffect, useMemo, useState } from 'react'
import CustomerTable from './components/CustomerTable.jsx'
import CustomerDetails from './components/CustomerDetails.jsx'
import KpiCard from "@/components/KpiCard";
const API_BASE = 'http://localhost:4000/api'
export default function App() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [riskFilter, setRiskFilter] = useState('All')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  async function fetchCustomers() {
    setLoading(true)
    setError(null)
    try {
      const url =
        riskFilter === 'All'
          ? `${API_BASE}/customers`
          : `${API_BASE}/customers?riskLevel=${riskFilter}`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      setCustomers(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
   async function exportReport() {
    try {
      const res = await fetch(`${API_BASE}/report`)

      if (!res.ok) {
        throw new Error('Failed to generate report')
      }

      const blob = await res.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = 'ChurnGuard_Report.pdf'
      document.body.appendChild(a)
      a.click()

      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Could not generate report')
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [riskFilter])

  const stats = useMemo(() => {
    const total = customers.length

    const high = customers.filter(
      c => c.riskLevel === 'High'
    ).length

    const medium = customers.filter(
      c => c.riskLevel === 'Medium'
    ).length

    const low = customers.filter(
      c => c.riskLevel === 'Low'
    ).length

    const avg =
      total > 0
        ? customers.reduce(
            (sum, c) => sum + (c.churnProbability || 0),
            0
          ) / total
        : 0

    const revenue = customers.reduce(
      (sum, c) => sum + (c.monthlyCharges || 0),
      0
    )

    return { total, high, medium, low, avg, revenue }
  }, [customers])

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">◆</div>
          <div>
            <h2>Churn<span>Guard</span></h2>
            <small>CUSTOMER RETENTION INTELLIGENCE</small>
          </div>
        </div>

        <nav>
          <button className="nav-item active">⌂ <span>Overview</span></button>
          <button className="nav-item">♙ <span>Customers</span></button>
          <button className="nav-item">⌁ <span>Analytics</span></button>
          <button className="nav-item">⌁ <span>Model Performance</span></button>
          <button className="nav-item">◇ <span>What-if Simulator</span></button>
          <button className="nav-item">▤ <span>Reports</span></button>
          <button className="nav-item">⚙ <span>Settings</span></button>
        </nav>

        <div className="model-card">
          <span className="model-label">ML ENGINE</span>
          <strong>XGBoost v1.0</strong>
          <p><i></i> Model Online</p>
          <div className="model-line" />
          <small>Production model</small>
          <b>XGBoost</b>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">

        <header className="topbar">
          <div>
            <p className="eyebrow">GOOD MORNING, ADMIN 👋</p>
            <h1>Welcome to <span>ChurnGuard</span></h1>
            <p className="description">
              Monitor at-risk customers and act before it's too late.

              
            </p>
          </div>

          <div className="top-actions">
            <div className="online">
              <i></i> Model Online
            </div>
            <button className="date-btn">◷ May 6 – May 12, 2025</button>
            <button className="export-btn" onClick={exportReport}>
  ↓ Export Report
</button>
          </div>
        </header>

        {/* STATS */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon purple">♙</div>
            <div>
              <p>Total Customers</p>
              <strong>{stats.total}</strong>
              <small className="positive">↑ Customer database</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">!</div>
            <div>
              <p>High Risk Customers</p>
              <strong>{stats.high}</strong>
              <small className="danger">↑ Requires attention</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">↗</div>
            <div>
              <p>Average Churn Risk</p>
              <strong>{(stats.avg * 100).toFixed(1)}%</strong>
              <small>Across all customers</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">$</div>
            <div>
              <p>Revenue at Risk</p>
              <strong>${stats.revenue.toLocaleString()}</strong>
              <small className="danger">Estimated monthly exposure</small>
            </div>
          </div>

        </section>

        {/* ANALYTICS */}
        <section className="analytics-grid">

          <div className="panel risk-panel">
            <div className="panel-title">
              <div>
                <h3>Risk Distribution</h3>
                <p>Customer portfolio</p>
              </div>
            </div>

            <div className="donut-area">
              <div
                className="donut"
                style={{
                  background: `conic-gradient(
                    #ff453a 0 ${(stats.high / Math.max(stats.total, 1)) * 100}%,
                    #ff9f0a ${(stats.high / Math.max(stats.total, 1)) * 100}% ${((stats.high + stats.medium) / Math.max(stats.total, 1)) * 100}%,
                    #20c76a ${((stats.high + stats.medium) / Math.max(stats.total, 1)) * 100}% 100%
                  )`
                }}
              >
                <div>
                  <strong>{stats.total}</strong>
                  <span>Customers</span>
                </div>
              </div>

              <div className="legend">
                <p><i className="dot red-dot"></i> High Risk <b>{stats.high}</b></p>
                <p><i className="dot orange-dot"></i> Medium Risk <b>{stats.medium}</b></p>
                <p><i className="dot green-dot"></i> Low Risk <b>{stats.low}</b></p>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <h3>Risk by Contract Type</h3>
                <p>Average churn probability</p>
              </div>
            </div>

            <div className="bars">
              {['Month-to-month', 'One year', 'Two year'].map((type, i) => {
                const data = customers.filter(c =>
                  c.contract?.toLowerCase().includes(
                    type === 'Month-to-month' ? 'month' :
                    type === 'One year' ? 'one' : 'two'
                  )
                )

                const value = data.length
                  ? data.reduce((s, c) => s + c.churnProbability, 0) / data.length
                  : 0

                return (
                  <div className="bar-row" key={type}>
                    <div>
                      <span>{type}</span>
                      <b>{(value * 100).toFixed(1)}%</b>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${value * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <h3>Churn Risk by Tenure</h3>
                <p>Customer probability</p>
              </div>
            </div>

            <div className="tenure-chart">
              {[0, 1, 2, 3].map((group) => {
                const ranges = [
                  [0, 6],
                  [7, 12],
                  [13, 24],
                  [25, 1000]
                ]
                const [min, max] = ranges[group]

                const data = customers.filter(
                  c => c.tenure >= min && c.tenure <= max
                )

                const value = data.length
                  ? data.reduce((s, c) => s + c.churnProbability, 0) / data.length
                  : 0

                return (
                  <div className="tenure-bar" key={group}>
                    <div
                      style={{ height: `${Math.max(value * 100, 5)}%` }}
                    >
                      {Math.round(value * 100)}%
                    </div>
                    <span>
                      {min}–{max === 1000 ? '24+' : max}m
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
        {/* CUSTOMERS */}
        <section className="customers-section">
          <div className="customer-header">
            <div>
              <h2>🔥 Customers at Highest Risk</h2>
              <p>Prioritize customers who need intervention first.</p>
            </div>
            <div className="controls">
              <input
                placeholder="⌕  Search customer ID..."
              />
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
              >
                <option value="All">Risk: All</option>
                <option value="High">Risk: High</option>
                <option value="Medium">Risk: Medium</option>
                <option value="Low">Risk: Low</option>
              </select>
              <button onClick={fetchCustomers}>↻</button>
            </div>
          </div>
          {loading && <div className="loading">Loading customers...</div>}
          {error && <div className="error">⚠ {error}</div>}
          {!loading && !error && (
            <CustomerTable
  customers={customers}
  onView={setSelectedCustomer}
/>
          )}
        </section>
      </main>
      {selectedCustomer && (
  <CustomerDetails
    customerId={selectedCustomer}
    onClose={() => setSelectedCustomer(null)}
  />
)}
    </div>
  
)
}
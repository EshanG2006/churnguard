import { useMemo, useState } from 'react'

const COLUMNS = [
  { key: 'customerRef', label: 'Customer ID' },
  { key: 'tenure', label: 'Tenure' },
  { key: 'contract', label: 'Contract Type' },
  { key: 'monthlyCharges', label: 'Monthly Charges' },
  { key: 'churnProbability', label: 'Churn Risk' },
  { key: 'riskLevel', label: 'Risk Level' },
]

export default function CustomerTable({ customers,onView }) {
  const [sortKey, setSortKey] = useState('churnProbability')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = useMemo(() => {
    return [...customers].sort((a, b) => {
      const x = a[sortKey]
      const y = b[sortKey]

      if (x === y) return 0

      return (x > y ? 1 : -1) * (sortDir === 'asc' ? 1 : -1)
    })
  }, [customers, sortKey, sortDir])

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (!customers.length) {
    return <div className="empty">No customers found.</div>
  }

  return (
    <div className="table-wrapper">
      <table className="customer-table">

        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="sort">
                    {sortDir === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            ))}
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map(c => {
            const risk = c.churnProbability * 100

            return (
              <tr key={c._id}>

                <td>
                  <strong className="customer-id">
                    <i className={`risk-line ${c.riskLevel?.toLowerCase()}`} />
                    {c.customerRef}
                  </strong>
                </td>

                <td>{c.tenure} months</td>

                <td>{c.contract}</td>

                <td>${c.monthlyCharges?.toFixed(2)}</td>

                <td>
                  <div className="risk-score">
                    <strong>{risk.toFixed(1)}%</strong>
                    <div>
                      <i
                        style={{
                          width: `${risk}%`
                        }}
                      />
                    </div>
                  </div>
                </td>

                <td>
                  <span className={`level ${c.riskLevel?.toLowerCase()}`}>
                    {c.riskLevel}
                  </span>
                </td>

                <td>
                  <button
  className="view-btn"
  onClick={() => onView(c._id)}
>
  ◉ View
</button>
                </td>

              </tr>
            )
          })}
        </tbody>

      </table>
    </div>
  )
}
import React, { useState } from "react";
import axios from "axios";
import "./Dashboard.css";

const API = "https://27cc98pjdl.execute-api.ap-south-1.amazonaws.com";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Connection States
  const [accountId, setAccountId] = useState(localStorage.getItem("targetAccountId") || "");
  const [roleName, setRoleName] = useState(localStorage.getItem("targetRoleName") || "CostOptimizerRole");

  const fetchData = async () => {
    if (!accountId || !roleName) {
      setError("Please provide an AWS Account ID and Role Name before scanning.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    // Persist latest inputs
    localStorage.setItem("targetAccountId", accountId);
    localStorage.setItem("targetRoleName", roleName);

    try {
      const res = await axios.get(`${API}/scan?account_id=${accountId}&role_name=${roleName}`);
      setData(res.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      // Properly extract backend error messages. Fallback to native error if unavailable.
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred while fetching data.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <img src="/logo.png" alt="Optimizer Logo" style={{ width: '40px', height: '40px', filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))' }} />
          AWS Cost Optimizer
        </h1>
      </div>

      <div className="dashboard-connection-card">
        <div className="dashboard-input-row">
          <div className="dashboard-input-group">
            <label>AWS Account ID</label>
            <input 
              type="text" 
              placeholder="e.g. 123456789012" 
              value={accountId} 
              onChange={(e) => setAccountId(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="dashboard-input-group">
            <label>IAM Role Name</label>
            <input 
              type="text" 
              placeholder="e.g. CostOptimizerRole" 
              value={roleName} 
              onChange={(e) => setRoleName(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <button
          className="dashboard-scan-btn"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="dashboard-spinner"></div>
              Scanning Account...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Scan Resources
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="dashboard-error-alert">
          <svg className="dashboard-error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <strong>Error Scanning Resources:</strong><br />
            {error}
            <br />
            <br />
            <em>Note: The Lambda execution role may not have STS AssumeRole rights, or the AWS Account limits were reached. Check to ensure the connected Role is correctly configured.</em>
          </div>
        </div>
      )}

      {data && (
        <div className="dashboard-card">
          <h3 className="dashboard-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            Usage Summary
          </h3>

          <div className="dashboard-summary-grid">
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.unused_volumes ?? 0}</div>
              <div className="dashboard-summary-label">Unused Volumes</div>
            </div>
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.snapshots ?? 0}</div>
              <div className="dashboard-summary-label">Snapshots</div>
            </div>
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.idle_ec2 ?? 0}</div>
              <div className="dashboard-summary-label">Idle EC2</div>
            </div>
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.unused_load_balancers ?? 0}</div>
              <div className="dashboard-summary-label">Unused LBs</div>
            </div>
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.nat_gateways ?? 0}</div>
              <div className="dashboard-summary-label">Idle NAT Gate</div>
            </div>
          </div>

          <h3 className="dashboard-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Recommendations
          </h3>

          <div className="dashboard-recommendation-list">
            {data.recommendations?.length > 0 ? (
              data.recommendations.map((r, i) => (
                <div key={i} className="dashboard-recommendation">
                  <div className="dashboard-recommendation-header">
                    <span className="dashboard-recommendation-type">{r.type}</span>
                    <span className="dashboard-recommendation-cost">Save ₹{r.monthly_cost}/mo</span>
                  </div>
                  <div className="dashboard-recommendation-id">
                    {r.id}
                    {(r.size || r.unused_days || r.region) && (
                      <div className="dashboard-recommendation-meta">
                        {r.region && <span>{r.region}</span>}
                        {r.size && (
                          <span className={r.region ? "dashboard-meta-divider" : ""}>
                            Size: {r.size} GB
                          </span>
                        )}
                        {r.unused_days && (
                          <span className={r.size || r.region ? "dashboard-meta-divider" : ""}>
                            Unused for {r.unused_days} days
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="dashboard-recommendation-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                    {r.action}
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-empty">
                🎉 No optimization needed! Your infrastructure is fully optimized.
              </div>
            )}
          </div>

          <div className="dashboard-total-savings">
            <div className="dashboard-total-title">Total Potential Savings</div>
            <h2 className="dashboard-total-amount">₹{data.total_savings ?? 0}</h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
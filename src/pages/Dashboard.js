import React, { useState } from "react";
import { Zap } from "lucide-react";
import { fetchAllAWSResources, isConfigured } from "../awsClient";
import { useAccount } from "../AccountContext";
import "./Dashboard.css";

function Dashboard() {
  const { setActiveArn } = useAccount();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [targetId, setTargetId] = useState("");
  const [targetRole, setTargetRole] = useState("CostOptimizerRole");

  const getCustomArn = () => {
    if (targetId && targetRole) {
      return `arn:aws:iam::${targetId}:role/${targetRole}`;
    }
    return null;
  };


  const fetchData = async () => {
    if (!isConfigured()) {
      setError("Please provide AWS Access Key, Secret, and Role ARN in the .env file.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    const customArn = getCustomArn();

    try {
      const resources = await fetchAllAWSResources(customArn);
      
      // Update the global account context
      if (customArn) {
        setActiveArn(customArn);
      } else {
        setActiveArn(null);
      }
      
      // Calculate summary statistics
      const summary = {
        ec2: resources.filter(r => r.type === "EC2 Instance").length,
        volumes: resources.filter(r => r.type === "EBS Volume").length,
        snapshots: resources.filter(r => r.type === "Snapshot").length,
        lbs: resources.filter(r => r.type.includes("Load Balancer")).length,
        nat: resources.filter(r => r.type === "NAT Gateway").length,
      };

      // Identify potential idle resources for quick recommendation preview
      const recommendations = resources.filter(r => r.isIdle).map(r => ({
        type: r.type,
        id: r.id,
        region: r.az,
        size: r.size,
        action: r.type === 'NAT Gateway' ? 'Review & Delete' : `Terminate/Delete ${r.type}`,
        monthly_cost: {
          'EC2 Instance': 1200,
          'EBS Volume': 180,
          'Snapshot': 45,
          'NAT Gateway': 3240,
          'Elastic IP': 360,
          'Load Balancer': 1850
        }[r.type] || 100
      }));

      setData({
        summary,
        recommendations,
        total_savings: recommendations.reduce((acc, curr) => acc + curr.monthly_cost, 0)
      });
    } catch (err) {
      console.error("Live Scan Error:", err);
      setError(err.message || "Failed to scan AWS account. Check your IAM credentials.");
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

      <div className="dashboard-summary-banner">
        <div className="dashboard-input-fields">
          <div className="dashboard-input-field">
            <label>Target Account ID</label>
            <input 
              type="text" 
              placeholder="e.g. 112233445566" 
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="dashboard-input-field">
            <label>Role Name</label>
            <input 
              type="text" 
              placeholder="e.g. CostOptimizerRole" 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        
        <button
          className={`dashboard-scan-btn ${loading ? 'loading' : ''}`}
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="dashboard-spinner"></div>
              Scanning Infrastructure...
            </>
          ) : (
            <>
              <Zap size={18} />
              Scan Real Environment
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
              <div className="dashboard-summary-value">{data.summary.volumes}</div>
              <div className="dashboard-summary-label">EBS Volumes</div>
            </div>
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.summary.snapshots}</div>
              <div className="dashboard-summary-label">Snapshots</div>
            </div>
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.summary.ec2}</div>
              <div className="dashboard-summary-label">EC2 Instances</div>
            </div>
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.summary.lbs}</div>
              <div className="dashboard-summary-label">Load Balancers</div>
            </div>
            <div className="dashboard-summary-item">
              <div className="dashboard-summary-value">{data.summary.nat}</div>
              <div className="dashboard-summary-label">NAT Gateways</div>
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
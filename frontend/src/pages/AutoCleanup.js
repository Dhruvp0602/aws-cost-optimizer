import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, Settings, CheckSquare, Square, RefreshCw } from "lucide-react";
import { fetchAllAWSResources, isConfigured } from "../services/awsClient";
import { useAccount } from "../context/AccountContext";
import "./AutoCleanup.css";

function AutoCleanup() {
  const { activeArn } = useAccount();
  const [resources, setResources] = useState([]);
  const [selected, setSelected] = useState([]);
  const [cleaning, setCleaning] = useState(false);
  const [cleaned, setCleaned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadResources = async () => {
    if (!isConfigured()) {
      setError("Please configure AWS credentials in .env first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const all = await fetchAllAWSResources(activeArn);
      // Only show resources that look 'idle' or 'orphaned' for cleanup suggestions
      const idle = all.filter(r => r.isIdle).map(r => ({
        id: r.id,
        type: r.type,
        name: r.name,
        age: r.launchTime ? new Date(r.launchTime).toLocaleDateString() : 'Unknown',
        cost: r.type === 'EC2 Instance' ? "₹850.00/mo" : r.type === 'EBS Volume' ? "₹120.00/mo" : "₹45.00/mo", // Estimated
        status: r.state || 'Idle'
      }));
      setResources(idle);
    } catch (err) {
      console.error("AutoCleanup Load Error:", err);
      setError("Failed to load real resources. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [activeArn]); // Re-run if the active account changes

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const available = resources.filter(r => !cleaned.includes(r.id));
    if (selected.length === available.length) {
      setSelected([]);
    } else {
      setSelected(available.map(r => r.id));
    }
  };

  const handleCleanup = () => {
    if (selected.length === 0) return;
    setCleaning(true);

    // NOTE: This is a simulation per user request. Real AWS deletion is disabled.
    setTimeout(() => {
      setCleaned(prev => [...prev, ...selected]);
      setSelected([]);
      setCleaning(false);
    }, 2500);
  };

  const availableResources = resources.filter(r => !cleaned.includes(r.id));

  return (
    <div className="cleanup-container">
      <div className="cleanup-header">
        <div>
          <h2 className="cleanup-title">Auto Cleanup</h2>
          <p className="cleanup-subtitle">Real-world suggestions for optimization</p>
        </div>

        <div className="cleanup-header-actions">
          <button className="cleanup-settings-btn" onClick={loadResources} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>
      </div>

      <div className="cleanup-alert">
        <AlertTriangle size={24} className="cleanup-alert-icon" />
        <div className="cleanup-alert-content">
          <h4>Warning: Action Simulation</h4>
          <p>This tool identifies orphaned resources in your AWS account. "Cleanup" currently <strong>only simulates deletion</strong> for visualization purposes. No real resources will be destroyed.</p>
        </div>
      </div>

      {error && (
        <div className="cleanup-error-alert" style={{ marginBottom: '20px', padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      <div className="cleanup-table-card">
        <div className="cleanup-table-toolbar">
          <div className="cleanup-table-stats">
            {availableResources.length} idle items found • {selected.length} selected
          </div>
          <button
            className={`cleanup-trigger-btn ${(selected.length === 0 || cleaning) ? 'disabled' : ''}`}
            onClick={handleCleanup}
            disabled={selected.length === 0 || cleaning}
          >
            {cleaning ? (
              <><div className="cleanup-spinner"></div> simulating...</>
            ) : (
              <><Trash2 size={16} /> Cleanup Selected</>
            )}
          </button>
        </div>

        <div className="cleanup-table-wrapper">
          <table className="cleanup-table">
            <thead>
              <tr>
                <th className="cleanup-th-check" onClick={selectAll} style={{ cursor: 'pointer' }}>
                  {selected.length > 0 && selected.length === availableResources.length ? (
                    <CheckSquare className="cleanup-checkbox active" />
                  ) : (
                    <Square className="cleanup-checkbox" />
                  )}
                </th>
                <th>Resource ID</th>
                <th>Type</th>
                <th>Name / Tag</th>
                <th>Age</th>
                <th>Reason</th>
                <th>Cost Savings</th>
              </tr>
            </thead>
            <tbody>
              {availableResources.length > 0 ? (
                availableResources.map((res) => (
                  <tr
                    key={res.id}
                    className={`cleanup-tr ${selected.includes(res.id) ? 'selected' : ''}`}
                    onClick={() => toggleSelect(res.id)}
                  >
                    <td className="cleanup-td-check">
                      {selected.includes(res.id) ? (
                        <CheckSquare className="cleanup-checkbox active" />
                      ) : (
                        <Square className="cleanup-checkbox" />
                      )}
                    </td>
                    <td className="cleanup-font-mono">{res.id}</td>
                    <td><span className="cleanup-type-badge">{res.type}</span></td>
                    <td>{res.name}</td>
                    <td>{res.age}</td>
                    <td><span className="cleanup-status-badge">{res.status}</span></td>
                    <td className="cleanup-cost-green">{res.cost}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="cleanup-empty-state">
                    {loading ? (
                      <div className="cleanup-spinner large"></div>
                    ) : (
                      <CheckSquare size={48} className="cleanup-empty-icon" />
                    )}
                    <p>{loading ? 'Scanning Infrastructure...' : 'All clean! No orphaned resources found in the target account.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AutoCleanup;

import React, { useState } from "react";
import { Trash2, AlertTriangle, Play, Settings, CheckSquare, Square } from "lucide-react";
import "./AutoCleanup.css";

const MOCK_RESOURCES = [
  { id: "vol-0f123456789abcdef", type: "EBS Volume", name: "old-db-backup", age: "45 days", cost: "₹20.00/mo", status: "Unattached" },
  { id: "snap-0123456789abcdef0", type: "Snapshot", name: "pre-migration-snap", age: "120 days", cost: "₹5.50/mo", status: "Orphaned" },
  { id: "eipalloc-01234567", type: "Elastic IP", name: "unused-prod-ip", age: "14 days", cost: "₹3.60/mo", status: "Unassociated" },
  { id: "nat-0987654321fedcba", type: "NAT Gateway", name: "dev-nat-gw", age: "3 days", cost: "₹32.40/mo", status: "No Traffic" }
];

function AutoCleanup() {
  const [selected, setSelected] = useState([]);
  const [cleaning, setCleaning] = useState(false);
  const [cleaned, setCleaned] = useState([]);

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selected.length === MOCK_RESOURCES.filter(r => !cleaned.includes(r.id)).length) {
      setSelected([]);
    } else {
      setSelected(MOCK_RESOURCES.filter(r => !cleaned.includes(r.id)).map(r => r.id));
    }
  };

  const handleCleanup = () => {
    if (selected.length === 0) return;
    setCleaning(true);
    
    // Mock cleanup API call
    setTimeout(() => {
      setCleaned(prev => [...prev, ...selected]);
      setSelected([]);
      setCleaning(false);
    }, 2500);
  };

  const availableResources = MOCK_RESOURCES.filter(r => !cleaned.includes(r.id));

  return (
    <div className="cleanup-container">
      <div className="cleanup-header">
        <div>
          <h2 className="cleanup-title">Auto Cleanup</h2>
          <p className="cleanup-subtitle">Safely remove orphaned or unused resources</p>
        </div>
        
        <div className="cleanup-header-actions">
          <button className="cleanup-settings-btn">
            <Settings size={18} /> Configure Rules
          </button>
        </div>
      </div>

      <div className="cleanup-alert">
        <AlertTriangle size={24} className="cleanup-alert-icon" />
        <div className="cleanup-alert-content">
          <h4>Warning: Action Irreversible</h4>
          <p>Resources deleted by the cleanup job cannot be recovered. Ensure you have backups if necessary before triggering a manual run.</p>
        </div>
      </div>

      <div className="cleanup-table-card">
        <div className="cleanup-table-toolbar">
          <div className="cleanup-table-stats">
            {availableResources.length} items found • {selected.length} selected
          </div>
          <button 
            className={`cleanup-trigger-btn ${(selected.length === 0 || cleaning) ? 'disabled' : ''}`}
            onClick={handleCleanup}
            disabled={selected.length === 0 || cleaning}
          >
            {cleaning ? (
              <><div className="cleanup-spinner"></div> Terminating...</>
            ) : (
              <><Trash2 size={16} /> Cleanup Selected</>
            )}
          </button>
        </div>

        <div className="cleanup-table-wrapper">
          <table className="cleanup-table">
            <thead>
              <tr>
                <th className="cleanup-th-check" onClick={selectAll} style={{cursor:'pointer'}}>
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
                    <CheckSquare size={48} className="cleanup-empty-icon" />
                    <p>All clean! No orphaned resources found.</p>
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

import React, { useState } from "react";
import { Bell, BellRing, Mail, Smartphone, Plus, Trash2, Edit2, ShieldCheck } from "lucide-react";
import "./Alerts.css";

const INITIAL_ALERTS = [
  { id: 1, name: "Monthly Budget Threshold", condition: "Actual Spend > ₹5,000", channels: ["Email", "SMS"], active: true },
  { id: 2, name: "Spike Detection", condition: "Daily Spend > 150% of avg", channels: ["Email"], active: true },
  { id: 3, name: "Idle Resource Warning", condition: "EC2 CPU < 5% for 14 Days", channels: ["Email"], active: false },
];

function Alerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const toggleAlert = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <div className="alerts-title-wrap">
          <div className="alerts-icon-bg">
            <BellRing size={24} className="alerts-hero-icon" />
          </div>
          <div>
            <h2 className="alerts-title">Alerts & Notifications</h2>
            <p className="alerts-subtitle">Manage your AWS budget alarms and resource warnings</p>
          </div>
        </div>
        <button className="alerts-create-btn">
          <Plus size={18} /> Create New Alert
        </button>
      </div>

      <div className="alerts-info-banner">
        <ShieldCheck size={20} className="alerts-info-icon" />
        <div className="alerts-info-content">
          <strong>AWS Configuration Required:</strong> These settings sync with Amazon CloudWatch and AWS Budgets. Ensure your SNS topics are properly configured to receive SMS/Email.
        </div>
      </div>

      <div className="alerts-section">
        <h3 className="alerts-section-title">Active Configurations</h3>
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alerts-card ${alert.active ? 'active' : 'inactive'}`}>
              <div className="alerts-card-header">
                <div>
                  <h4 className="alerts-card-name">{alert.name}</h4>
                  <div className="alerts-card-condition">Trigger: <span>{alert.condition}</span></div>
                </div>
                <div className="alerts-toggle-wrapper">
                  <label className="alerts-switch">
                    <input 
                      type="checkbox" 
                      checked={alert.active} 
                      onChange={() => toggleAlert(alert.id)}
                    />
                    <span className="alerts-slider round"></span>
                  </label>
                </div>
              </div>

              <div className="alerts-card-footer">
                <div className="alerts-channels">
                  {alert.channels.includes("Email") && (
                    <span className="alerts-channel-badge email">
                      <Mail size={12} /> Email
                    </span>
                  )}
                  {alert.channels.includes("SMS") && (
                    <span className="alerts-channel-badge sms">
                      <Smartphone size={12} /> SMS
                    </span>
                  )}
                </div>
                <div className="alerts-card-actions">
                  <button className="alerts-action-btn edit"><Edit2 size={16} /></button>
                  <button className="alerts-action-btn delete" onClick={() => deleteAlert(alert.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="alerts-empty">
              <Bell size={32} />
              <p>No alerts configured. Create one to monitor your spend.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Alerts;

import React, { useState } from "react";
import axios from "axios";
import "./ConnectAWS.css";

const API = "https://27cc98pjdl.execute-api.ap-south-1.amazonaws.com";

function ConnectAWS() {
  const [accountId, setAccountId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId || !roleName) {
      setStatus({ type: "error", message: "Please fill in all fields" });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      // Save targets into your browser seamlessly for the Dashboard to pick up
      localStorage.setItem("targetAccountId", accountId);
      localStorage.setItem("targetRoleName", roleName);

      await axios.post(`${API}/connect-aws`, {
        aws_account_id: accountId,
        role_name: roleName,
      });

      setStatus({ type: "success", message: "AWS Account Connected Successfully! 🎉" });
      setAccountId("");
      setRoleName("");
    } catch (err) {
      setStatus({ type: "error", message: "Failed to connect AWS Account. Please check your details." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connect-aws-page">
      <div className="connect-aws-card">
        <div className="connect-aws-header">
          <div className="connect-aws-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white" fillOpacity="0.2"/>
              <path d="M16 12L12 8L8 12M12 16V8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="connect-aws-title">Connect AWS Account</h2>
          <p className="connect-aws-subtitle">Link your AWS account to optimize costs securely.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="connect-aws-form-group">
            <label className="connect-aws-label">AWS Account ID</label>
            <div className="connect-aws-input-wrapper">
              <input
                className="connect-aws-input"
                type="text"
                placeholder="e.g. 123456789012"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={loading}
              />
              <div className="connect-aws-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
          </div>

          <div className="connect-aws-form-group">
            <label className="connect-aws-label">IAM Role Name</label>
            <div className="connect-aws-input-wrapper">
              <input
                className="connect-aws-input"
                type="text"
                placeholder="e.g. CostOptimizerRole"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={loading}
              />
              <div className="connect-aws-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="connect-aws-button" 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="connect-aws-button-spinner"></div>
                Connecting...
              </>
            ) : (
              "Connect Account"
            )}
          </button>
        </form>

        {status.message && (
          <div className={`connect-aws-status ${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectAWS;
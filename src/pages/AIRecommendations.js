import React, { useState } from "react";
import { Sparkles, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import "./AIRecommendations.css";

const MOCK_RECOMMENDATIONS = [
  {
    id: "rec-001",
    title: "Downsize Over-provisioned EC2 Instance",
    description: "Instance 'i-0ab12c34d5e6789f0' (t3.xlarge) CPU utilization has been consistently below 10% for the last 14 days. Downsizing to t3.medium is recommended.",
    service: "EC2",
    savings: 85.50,
    impact: "High",
    applied: false
  },
  {
    id: "rec-002",
    title: "Delete Unattached EBS Volume",
    description: "Volume 'vol-0f123456789abcdef' (500 GB gp3) has been unattached since Oct 12, 2023. Deleting it will stop unnecessary charges.",
    service: "EBS",
    savings: 40.00,
    impact: "Medium",
    applied: false
  },
  {
    id: "rec-003",
    title: "Move S3 Data to Infrequent Access",
    description: "Bucket 'company-backup-logs-2023' has not been accessed in 90 days. Transitioning to S3 Standard-IA will reduce storage costs.",
    service: "S3",
    savings: 120.25,
    impact: "High",
    applied: false
  }
];

function AIRecommendations() {
  const [recs, setRecs] = useState(MOCK_RECOMMENDATIONS);
  const [analyzing, setAnalyzing] = useState(false);

  const handleApply = (id) => {
    setRecs(current => current.map(rec => 
      rec.id === id ? { ...rec, applied: true } : rec
    ));
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
    }, 2000);
  };

  const totalPotentialSavings = recs
    .filter(r => !r.applied)
    .reduce((acc, curr) => acc + curr.savings, 0);

  return (
    <div className="ai-rec-container">
      <div className="ai-rec-header">
        <div className="ai-rec-title-wrap">
          <div className="ai-icon-bg">
            <Sparkles size={28} className="ai-sparkle-icon" />
          </div>
          <div>
            <h2 className="ai-title">Compute Optimizer AI</h2>
            <p className="ai-subtitle">Actionable insights powered by AWS machine learning</p>
          </div>
        </div>
        <button 
          className={`ai-reanalyze-btn ${analyzing ? 'analyzing' : ''}`}
          onClick={runAnalysis}
          disabled={analyzing}
        >
          {analyzing ? (
            <><div className="ai-spinner"></div> Analyzing...</>
          ) : (
            <><Zap size={18} /> Re-analyze Infrastructure</>
          )}
        </button>
      </div>

      <div className="ai-summary-banner">
        <div className="ai-summary-content">
          <h3 className="ai-summary-title">Total Potential Monthly Savings</h3>
          <div className="ai-summary-value">₹{totalPotentialSavings.toFixed(2)}</div>
        </div>
        <div className="ai-summary-badge">
          {recs.filter(r => !r.applied).length} Active Insights
        </div>
      </div>

      <div className="ai-rec-list">
        {recs.map(rec => (
          <div key={rec.id} className={`ai-rec-card ${rec.applied ? 'applied' : ''}`}>
            <div className="ai-rec-card-header">
              <span className={`ai-service-badge ${rec.service.toLowerCase()}`}>
                {rec.service}
              </span>
              <span className={`ai-impact-badge ${rec.impact.toLowerCase()}`}>
                {rec.impact} Impact
              </span>
            </div>
            
            <h4 className="ai-rec-card-title">{rec.title}</h4>
            <p className="ai-rec-card-desc">{rec.description}</p>
            
            <div className="ai-rec-card-footer">
              <div className="ai-rec-savings">
                <span className="ai-savings-label">Est. Savings</span>
                <span className="ai-savings-value">₹{rec.savings.toFixed(2)}/mo</span>
              </div>
              
              {rec.applied ? (
                <div className="ai-applied-status">
                  <CheckCircle2 size={18} /> Applied
                </div>
              ) : (
                <button 
                  className="ai-apply-btn"
                  onClick={() => handleApply(rec.id)}
                >
                  Apply Recommendation <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AIRecommendations;

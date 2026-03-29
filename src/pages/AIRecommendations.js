import React, { useState } from "react";
import { Sparkles, ArrowRight, Zap, CheckCircle2, AlertTriangle, Cpu } from "lucide-react";
import { fetchAllAWSResources, isConfigured } from "../awsClient";
import { useAccount } from "../AccountContext";
import "./AIRecommendations.css";

function AIRecommendations() {
  const { activeArn } = useAccount();
  const [recs, setRecs] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleApply = (id) => {
    setRecs(current => current.map(rec =>
      rec.id === id ? { ...rec, applied: true } : rec
    ));
  };

  const runAnalysis = async () => {
    const apiKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!apiKey || apiKey === "YOUR_GROQ_API_KEY_HERE") {
      setError("Add your Groq API key to the .env file as REACT_APP_GROQ_API_KEY and restart.");
      return;
    }

    setError("");
    setAnalyzing(true);

    try {
      const resources = await fetchAllAWSResources(activeArn);
      
      // Create a rich context for the AI with more details
      const resourceContext = resources.map(r => ({
        id: r.id,
        type: r.type,
        name: r.name,
        state: r.state,
        size: r.size,
        isIdle: r.isIdle,
        az: r.az,
        launchTime: r.launchTime
      }));

      const prompt = `You are an expert AWS Cost Optimization Architect. I have performed a real-time scan of an AWS environment and found the following resources:
      ${JSON.stringify(resourceContext)}
      
      Analyze these SPECIFIC resources and generate exactly 3 highly actionable cost-saving recommendations as a JSON array.
      
      Look specifically for:
      1. NAT Gateways that are idle or in regions with zero traffic (NAT Gateways cost ~₹3200/mo just to exist).
      2. EC2 Instances that are 'stopped' or have low utilization.
      3. EBS Volumes that are 'unattached' (orphaned).
      4. Elastic IPs that are 'unassociated' (they cost money when NOT used).
      5. Old Snapshots that are no longer needed.
      
      Output ONLY raw JSON with no markdown fences, no explanation, no preamble.
      Format: [{"id":"ai-1","title":"...","description":"...","service":"EC2|NAT Gateway|EBS|S3|EIP","savings":123.45,"impact":"High|Medium","applied":false}]`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const content = data.choices[0].message.content;
      const jsonStart = content.indexOf("[");
      const jsonEnd = content.lastIndexOf("]") + 1;
      const parsed = JSON.parse(content.substring(jsonStart, jsonEnd));
      setRecs(parsed);
    } catch (err) {
      setError("AI analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
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
            <p className="ai-subtitle">Live insights powered by Groq Llama 3.1 — completely free</p>
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
            <><Zap size={18} /> Generate AI Insights</>
          )}
        </button>
      </div>

      {error && (
        <div className="ai-error-bar">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {recs.length > 0 && (
        <div className="ai-summary-banner">
          <div className="ai-summary-content">
            <h3 className="ai-summary-title">Total Potential Monthly Savings</h3>
            <div className="ai-summary-value">₹{totalPotentialSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="ai-summary-badge">
            {recs.filter(r => !r.applied).length} Active Insights
          </div>
        </div>
      )}

      <div className="ai-rec-list">
        {recs.length > 0 ? (
          recs.map(rec => (
            <div key={rec.id} className={`ai-rec-card ${rec.applied ? 'applied' : ''}`}>
              <div className="ai-rec-card-header">
                <span className={`ai-service-badge ${rec.service.toLowerCase().replace(' ', '-')}`}>
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
                  <span className="ai-savings-value">₹{Number(rec.savings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/mo</span>
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
          ))
        ) : !analyzing ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon">
              <Cpu size={48} />
            </div>
            <h3>No Active Insights</h3>
            <p>Click the <b>Generate AI Insights</b> button above to scan your real AWS infrastructure for cost-saving opportunities.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AIRecommendations;

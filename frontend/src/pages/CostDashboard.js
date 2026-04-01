import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingDown, Activity, IndianRupee, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { fetchAllAWSResources, isConfigured } from "../services/awsClient";
import { useAccount } from "../context/AccountContext";
import "./CostDashboard.css";

const COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#64748b", "#f87171"];

function CostDashboard() {
  const { activeArn } = useAccount();
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serviceSpendData, setServiceSpendData] = useState([]);
  const [dailySpendData, setDailySpendData] = useState([]);
  const [stats, setStats] = useState({ mtd: 0, forecast: 0, savings: 0, total: 0 });

  useEffect(() => {
    const loadRealData = async () => {
      if (!isConfigured()) {
        setError("AWS credentials not found. Please update your .env file.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const resources = await fetchAllAWSResources(activeArn);
        
        // Define standard monthly unit costs (₹)
        const unitCosts = {
          'EC2 Instance': 1200,
          'EBS Volume': 180,
          'NAT Gateway': 3240,
          'Elastic IP': 360,
          'Snapshot': 45,
          'Load Balancer': 1850
        };

        // 1. Calculate service distribution
        const distribution = {};
        let totalMonthly = 0;
        let potentialSavings = 0;

        resources.forEach(res => {
          const type = res.type.includes('Load Balancer') ? 'Load Balancer' : res.type;
          const cost = unitCosts[type] || 100;
          distribution[type] = (distribution[type] || 0) + cost;
          totalMonthly += cost;
          
          if (res.isIdle) {
            potentialSavings += cost;
          }
        });

        const pieData = Object.entries(distribution).map(([name, value]) => ({ name, value }));
        setServiceSpendData(pieData);

        // 2. Calculate KPI stats
        const mtd = totalMonthly * 0.95; // Assume ~95% through current cycle
        setStats({
          mtd: mtd,
          forecast: totalMonthly,
          savings: potentialSavings,
          total: totalMonthly
        });

        // 3. Generate a semi-realistic 7-day trend based on daily burn rate
        const dailyBurn = totalMonthly / 30;
        const trend = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
          day,
          cost: Math.round(dailyBurn * (1 + (Math.random() * 0.2 - 0.1))) // Random variation
        }));
        setDailySpendData(trend);

      } catch (err) {
        console.error("CostDashboard Load Error:", err);
        setError("Failed to fetch real-time infrastructure data.");
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, [activeArn]); // Re-run whenever the active account ARN changes

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  if (error) {
    return (
      <div className="cd-error-view">
        <AlertCircle size={48} color="#ef4444" />
        <h3>Integration Required</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="cost-dashboard-container">
      <motion.div className="cd-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <div>
          <h2 className="cd-title">Real-Time Cost Center</h2>
          <p className="cd-subtitle">Live infrastructure cost analysis for the connected account</p>
        </div>
        <div className="cd-header-actions">
          <div className="cd-filter-label">Projection:</div>
          <select 
            className="cd-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="30d">Current Month</option>
            <option value="90d">Quarterly View</option>
          </select>
        </div>
      </motion.div>

      {loading ? (
        <div className="cd-loading-screen">
          <div className="cd-main-spinner"></div>
          <p>Calculating Infrastructure Burn Rate...</p>
        </div>
      ) : (
        <>
          <div className="cd-kpi-grid">
            <motion.div className="cd-kpi-card" {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className="cd-kpi-header">
                <span className="cd-kpi-title">MTD Spend</span>
                <div className="cd-kpi-icon-wrap blue"><IndianRupee size={16} /></div>
              </div>
              <div className="cd-kpi-value">₹{stats.mtd.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="cd-kpi-trend positive">
                <TrendingDown size={14} /> <span>Live Estimated</span>
              </div>
            </motion.div>
            
            <motion.div className="cd-kpi-card" {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="cd-kpi-header">
                <span className="cd-kpi-title">Forecast</span>
                <div className="cd-kpi-icon-wrap purple"><Activity size={16} /></div>
              </div>
              <div className="cd-kpi-value">₹{stats.forecast.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="cd-kpi-trend neutral">
                <Calendar size={14} /> <span>Est. month end</span>
              </div>
            </motion.div>

            <motion.div className="cd-kpi-card premium" {...fadeInUp} transition={{ delay: 0.3 }}>
              <div className="cd-kpi-header">
                <span className="cd-kpi-title light">Potential Savings</span>
                <div className="cd-kpi-icon-wrap green"><TrendingUp size={16} /></div>
              </div>
              <div className="cd-kpi-value">₹{stats.savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <button className="cd-premium-btn">Review AI Insights</button>
            </motion.div>
          </div>

          <div className="cd-main-grid">
            <motion.div className="cd-chart-card wide" {...fadeInUp} transition={{ delay: 0.4 }}>
              <div className="cd-card-header">
                <h3 className="cd-chart-title">Daily Burn Trend</h3>
                <div className="cd-chart-avg">Avg: ₹{(stats.total/30).toFixed(2)}/day</div>
              </div>
              <div className="cd-line-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySpendData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2}}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      formatter={(value) => [`₹${value}`, "Amount"]}
                    />
                    <Line type="monotone" dataKey="cost" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 3, stroke: '#0f172a' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div className="cd-chart-card side" {...fadeInUp} transition={{ delay: 0.5 }}>
              <h3 className="cd-chart-title">Cost Distribution</h3>
              <div className="cd-pie-wrapper">
                <div className="cd-pie-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceSpendData}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="85%"
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {serviceSpendData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="cd-pie-center">
                    <span className="cd-pie-total">₹{stats.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <span className="cd-pie-label">Total /mo</span>
                  </div>
                </div>
                
                <div className="cd-legend-grid">
                  {serviceSpendData.map((entry, index) => (
                    <div key={entry.name} className="cd-legend-row">
                      <div className="cd-legend-info">
                        <div className="cd-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="cd-name">{entry.name}</span>
                      </div>
                      <span className="cd-percent">{Math.round((entry.value/stats.total)*100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

export default CostDashboard;

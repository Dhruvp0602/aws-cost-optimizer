import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingDown, Activity, IndianRupee, Calendar } from "lucide-react";
import "./CostDashboard.css";

const dailySpendData = [
  { day: "Mon", cost: 120 },
  { day: "Tue", cost: 132 },
  { day: "Wed", cost: 101 },
  { day: "Thu", cost: 142 },
  { day: "Fri", cost: 90 },
  { day: "Sat", cost: 65 },
  { day: "Sun", cost: 50 },
];

const serviceSpendData = [
  { name: "EC2", value: 400 },
  { name: "RDS", value: 300 },
  { name: "S3", value: 100 },
  { name: "Lambda", value: 50 },
  { name: "Other", value: 150 },
];
const COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#64748b"];

function CostDashboard() {
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="cost-dashboard-container">
      <div className="cd-header">
        <div>
          <h2 className="cd-title">Cost Intelligence Dashboard</h2>
          <p className="cd-subtitle">Analyze your AWS spend across services and regions</p>
        </div>
        <div className="cd-filters">
          <select 
            className="cd-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="cd-kpi-grid">
        <div className="cd-kpi-card">
          <div className="cd-kpi-header">
            <span className="cd-kpi-title">Current Month Spend</span>
            <IndianRupee size={20} className="cd-kpi-icon blue" />
          </div>
          <div className="cd-kpi-value">₹1,245.00</div>
          <div className="cd-kpi-trend positive">
            <TrendingDown size={14} /> <span>12% less than last month</span>
          </div>
        </div>
        
        <div className="cd-kpi-card">
          <div className="cd-kpi-header">
            <span className="cd-kpi-title">Forecasted Spend</span>
            <Activity size={20} className="cd-kpi-icon purple" />
          </div>
          <div className="cd-kpi-value">₹1,890.00</div>
          <div className="cd-kpi-trend neutral">
            <Calendar size={14} /> <span>By end of month</span>
          </div>
        </div>

        <div className="cd-kpi-card gradient">
          <div className="cd-kpi-header">
            <span className="cd-kpi-title text-white">Potential Savings</span>
            <IndianRupee size={20} className="cd-kpi-icon white-translucent" />
          </div>
          <div className="cd-kpi-value text-white">₹450.00</div>
          <button className="cd-action-btn">View AI Recommendations</button>
        </div>
      </div>

      <div className="cd-charts-grid">
        <div className="cd-chart-card">
          <h3 className="cd-chart-title">Daily Spend Trend</h3>
          <div className="cd-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySpendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="cost" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                  formatter={(value) => [`₹${value}`, "Cost"]}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cd-chart-card">
          <h3 className="cd-chart-title">Spend by Service</h3>
          <div className="cd-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceSpendData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {serviceSpendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value) => [`₹${value}`, "Cost"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="cd-custom-legend">
            {serviceSpendData.map((entry, index) => (
              <div key={entry.name} className="cd-legend-item">
                <div className="cd-legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="cd-legend-name">{entry.name}</span>
                <span className="cd-legend-value">₹{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CostDashboard;

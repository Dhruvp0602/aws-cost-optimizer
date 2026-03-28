import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import CostDashboard from "./pages/CostDashboard";
import AIRecommendations from "./pages/AIRecommendations";
import AutoCleanup from "./pages/AutoCleanup";
import Alerts from "./pages/Alerts";
import { LayoutDashboard, Calculator, Sparkles, Trash2, BellRing, LogOut } from "lucide-react";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "cost":
        return <CostDashboard />;
      case "ai":
        return <AIRecommendations />;
      case "cleanup":
        return <AutoCleanup />;
      case "alerts":
        return <Alerts />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <nav className="app-sidebar">
        <div className="app-logo">
          <img src="/logo.png" alt="Optimizer Logo" style={{ width: '36px', height: '36px', filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))' }} />
          <span>Optimizer</span>
        </div>
        
        <div className="app-nav-links">
          <button 
            className={`app-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} />
            Scanner
          </button>
          
          <button 
            className={`app-nav-btn ${activeTab === 'cost' ? 'active' : ''}`}
            onClick={() => setActiveTab("cost")}
          >
            <Calculator size={20} />
            Cost Dashboard
          </button>
          
          <button 
            className={`app-nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab("ai")}
          >
            <Sparkles size={20} />
            AI Insights
          </button>
          
          <button 
            className={`app-nav-btn ${activeTab === 'cleanup' ? 'active' : ''}`}
            onClick={() => setActiveTab("cleanup")}
          >
            <Trash2 size={20} />
            Auto Cleanup
          </button>
          
          <button 
            className={`app-nav-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab("alerts")}
          >
            <BellRing size={20} />
            Alerts
          </button>
        </div>

        <div className="app-sidebar-footer">
          <div className="app-user-badge">
            <div className="app-avatar">A</div>
            <span>Admin</span>
          </div>
          <button className="app-logout-btn" onClick={() => setIsAuthenticated(false)}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="app-main-content">
        <div className="app-glass-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
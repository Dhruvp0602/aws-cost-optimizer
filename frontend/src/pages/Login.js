import React, { useState } from "react";
import { ShieldAlert, ArrowRight, User, Lock, Mail } from "lucide-react";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields to login.");
      return;
    }
    setError("");
    setIsLoading(true);

    // Mock authentication delay
    setTimeout(() => {
      if (email === "admin@optimizer.aws" && password === "admin123") {
        onLogin();
      } else {
        setError("Invalid credentials. Try admin@optimizer.aws / admin123");
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="login-container">
      <div className="login-glow-sphere top-left"></div>
      <div className="login-glow-sphere bottom-right"></div>
      
      <div className="login-glass-card">
        <div className="login-header">
          <div className="login-logo-ring">
            <img src="/logo.png" alt="Optimizer Logo" style={{ width: '40px', height: '40px', zIndex: 2 }} />
          </div>
          <h2>Sign in to Optimizer</h2>
          <p>Secure access to your AWS Cost Intelligence</p>
        </div>

        {error && (
          <div className="login-error">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label>Work Email</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input 
                type="email" 
                placeholder="admin@optimizer.aws" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="login-input-group">
            <div className="login-label-row">
              <label>Password</label>
              <a href="#" className="login-forgot-link">Forgot password?</a>
            </div>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="login-spinner"></div>
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Protected by Advanced Encryption and AWS Cognito</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

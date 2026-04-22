import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebaseConfig';
import { syncUserWithBackend } from '../services/apiService';
import { CarFront, Mail, Lock, ShieldCheck, Banknote, Clock8, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        if (!name) return setError("Please provide your full name");
        
        // 1. Create user in Firebase Auth
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Sync new user to MongoDB backend
        await syncUserWithBackend({
            firebaseUid: creds.user.uid,
            email: creds.user.email,
            name: name,
            role: 'DRIVER'
        });
      } else {
        // 1. Sign in with Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      onAuthSuccess();
    } catch (err) {
      // Clean up Firebase error messages for better UX
      setError(err.message.replace('Firebase:', '').trim());
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left side (Visuals + Branding) */}
      <div className="auth-left animate-fade-in">

        <h1 className="hero-text">
          Drive.<br/>Earn.<br/>
          <span className="highlight-text">Grow.</span>
        </h1>
        <p className="hero-subtext">Join thousands of drivers<br/>and unlock your potential</p>
        
        <div className="features-row">
           <div className="feature-item">
              <div className="feature-icon"><ShieldCheck size={20} strokeWidth={2}/></div>
              <h3>Safe & Secure</h3>
              <p>Your safety is<br/>our priority</p>
           </div>
           <div className="feature-item">
              <div className="feature-icon"><Banknote size={20} strokeWidth={2}/></div>
              <h3>Great Earnings</h3>
              <p>Earn more with<br/>flexible hours</p>
           </div>
           <div className="feature-item">
              <div className="feature-icon"><Clock8 size={20} strokeWidth={2}/></div>
              <h3>24/7 Support</h3>
              <p>We're here for you<br/>anytime</p>
           </div>
        </div>
      </div>

      {/* Right side (Login Form) */}
      <div className="auth-right animate-fade-in">
        <div className="auth-card">
          
          <div className="auth-header">
            <div className="auth-icon-wrapper">
              <CarFront color="#fff" size={36} strokeWidth={2.5} />
            </div>
            <h1 className="auth-title">
              Welcome Back, <span className="highlight-text">Driver!</span>
            </h1>
            <p className="auth-subtitle">Sign in to continue your journey</p>
          </div>

          {error && (
            <div className="auth-error-box">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {isRegistering && (
              <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
              </div>
            )}
            
            <div className="input-group">
              <Mail size={18} color="#64748b" className="input-icon" />
              <input  
                type="email" 
                placeholder="Email or Phone Number" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <Lock size={18} color="#64748b" className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <div 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
              </div>
            </div>
            
            {!isRegistering && (
              <div className="auth-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  Remember me
                </label>
                <span className="forgot-password">Forgot Password?</span>
              </div>
            )}

            <button type="submit" className="btn-primary">
              {isRegistering ? 'Register Now' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="social-divider">
              <div className="divider-line"></div>
              <span className="divider-text">or continue with</span>
          </div>
          
          <div className="social-buttons">
              <button className="btn-social">
                <span className="social-icon google">G</span> Google
              </button>
              <button className="btn-social">
                <span className="social-icon facebook">f</span> Facebook
              </button>
          </div>

          <div className="auth-footer">
            <span className="footer-text">
              {isRegistering ? 'Already have an account?' : "New here?"}
            </span>
            <span 
              className="footer-link"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Sign In' : 'Register Now'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}



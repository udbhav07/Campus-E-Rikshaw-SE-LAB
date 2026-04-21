import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebaseConfig';
import { CarFront, Mail, Lock, ShieldCheck, Banknote, Clock8 } from 'lucide-react';

export default function Login({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let creds;
      if (isRegistering) {
        if (!name) return setError("Please provide your full name");
        creds = await createUserWithEmailAndPassword(auth, email, password);
        
        // Sync to MongoDB
        await fetch('http://localhost:5000/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firebaseUid: creds.user.uid,
                email: creds.user.email,
                name: name,
                role: 'DRIVER'
            })
        });

      } else {
        creds = await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    }
  };

  return (
    <div className="auth-container">
      <div className="login-bg"></div>
      
      {/* Left Side Hero */}
      <div className="login-side-content animate-fade-in" style={{ display: 'none' /* hidden on mobile, shown via css on desktop */}}>
        <h1 className="hero-text">Drive.<br/>Earn.<br/><span className="highlight-text">Grow.</span></h1>
        <p className="hero-subtext">Join thousands of drivers<br/>and unlock your potential</p>
        
        <div className="features-row">
           <div className="feature-item">
              <div className="feature-icon"><ShieldCheck size={20}/></div>
              <h3>Safe & Secure</h3>
              <p>Your safety is<br/>our priority</p>
           </div>
           <div className="feature-item">
              <div className="feature-icon"><Banknote size={20}/></div>
              <h3>Great Earnings</h3>
              <p>Earn more with<br/>flexible hours</p>
           </div>
           <div className="feature-item">
              <div className="feature-icon"><Clock8 size={20}/></div>
              <h3>24/7 Support</h3>
              <p>We're here for you<br/>anytime</p>
           </div>
        </div>
      </div>

      <div className="glass-panel auth-card animate-fade-in" style={{ backgroundColor: '#111520', borderColor: 'rgba(255,255,255,0.05)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', padding: '16px', borderRadius: '20px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)' }}>
             <CarFront color="#fff" size={36} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>
            Welcome Back, <span className="highlight-text">Driver!</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Sign in to continue your journey</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 0, 85, 0.1)', color: 'var(--danger)', border: '1px solid rgba(255,0,85,0.3)', padding: '14px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
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
            <Mail size={18} color="var(--text-muted)" style={{ marginLeft: '12px' }}/>
            <input  
              style={{ marginLeft: '12px' }}
              type="email" 
              placeholder="Email or Phone Number" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <Lock size={18} color="var(--text-muted)" style={{ marginLeft: '12px' }}/>
            <input 
              style={{ marginLeft: '12px' }}
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {!isRegistering && (
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <label style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                 <input type="checkbox" style={{ marginRight: '8px' }} />
                 Remember me
               </label>
               <span style={{ color: '#3b82f6', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>Forgot Password?</span>
             </div>
          )}

          <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s' }}>
            {isRegistering ? 'Register Now' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', position: 'relative', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', position: 'absolute', top: '50%', left: '0', right: '0', zIndex: 1 }}></div>
            <span style={{ background: '#111520', padding: '0 12px', fontSize: '13px', color: '#94a3b8', position: 'relative', zIndex: 2 }}>or continue with</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px', marginBottom: '32px' }}>
             <button style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Google</button>
             <button style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Facebook</button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
            {isRegistering ? 'Already have an account?' : "New here?"}
          </span>
          <span 
            style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginLeft: '6px' }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Sign In' : 'Register Now'}
          </span>
        </div>

      </div>
    </div>
  );
}



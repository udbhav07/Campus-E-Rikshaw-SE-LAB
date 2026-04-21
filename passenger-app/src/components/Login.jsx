import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebaseConfig';
import { CarFront, Mail, Lock, Zap, Tag, MapPin, Eye, EyeOff, ArrowRight } from 'lucide-react';

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
      let creds;
      if (isRegistering) {
        if (!name) return setError("Please provide your full name");
        creds = await createUserWithEmailAndPassword(auth, email, password);
        
        await fetch('http://localhost:5000/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firebaseUid: creds.user.uid,
                email: creds.user.email,
                name: name,
                role: 'PASSENGER'
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
    <div className="auth-split-layout">
      {/* Left side (Visuals + Branding) */}
      <div className="auth-left animate-fade-in">

        <h1 className="hero-text">
          Ride.<br/>Relax.<br/>
          <span className="highlight-text">Arrive.</span>
        </h1>
        <p className="hero-subtext">Book rides instantly and<br/>travel comfortably anywhere</p>
        
        <div className="features-row">
           <div className="feature-item">
              <div className="feature-icon"><Zap size={20} strokeWidth={2}/></div>
              <h3>Fast Booking</h3>
              <p>Book a ride in<br/>seconds</p>
           </div>
           <div className="feature-item">
              <div className="feature-icon"><Tag size={20} strokeWidth={2}/></div>
              <h3>Affordable Rides</h3>
              <p>Best prices for<br/>every journey</p>
           </div>
           <div className="feature-item">
              <div className="feature-icon"><MapPin size={20} strokeWidth={2}/></div>
              <h3>Live Tracking</h3>
              <p>Track your ride<br/>in real-time</p>
           </div>
        </div>
      </div>

      {/* Right side (Login Form) */}
      <div className="auth-right animate-fade-in">
        <div className="auth-card">
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ background: 'linear-gradient(135deg, #d946ef 0%, #a855f7 100%)', padding: '16px', borderRadius: '18px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(217, 70, 239, 0.4)' }}>
              <CarFront color="#fff" size={36} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: '-0.5px' }}>
              Welcome <span className="highlight-text">Back!</span>
            </h1>
            <p style={{ color: '#8b9bb4', fontSize: '14px', marginTop: '8px' }}>Sign in to continue your journey</p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(255, 0, 85, 0.1)', color: '#ff0055', border: '1px solid rgba(255,0,85,0.3)', padding: '14px', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
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
              <Mail size={18} color="#64748b" style={{ marginLeft: '12px' }}/>
              <input  
                type="email" 
                placeholder="Email or Phone Number" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <Lock size={18} color="#64748b" style={{ marginLeft: '12px' }}/>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <div 
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
              </div>
            </div>
            
            {!isRegistering && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <label style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ marginRight: '8px', accentColor: '#d946ef' }} />
                  Remember me
                </label>
                <span style={{ color: '#d946ef', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>Forgot Password?</span>
              </div>
            )}

            <button type="submit" className="btn-primary">
              {isRegistering ? 'Register Now' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '32px', position: 'relative', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', position: 'absolute', top: '50%', left: '0', right: '0', zIndex: 1 }}></div>
              <span style={{ background: '#15111b', padding: '0 12px', fontSize: '12px', color: '#64748b', position: 'relative', zIndex: 2 }}>or continue with</span>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', marginBottom: '32px' }}>
              <button style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: '#1c1624', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseOut={e=>e.currentTarget.style.background='#1c1624'}>
                <span style={{color:'#ea4335', fontWeight: '900', fontSize: '18px'}}>G</span> Google
              </button>
              <button style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: '#1c1624', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseOut={e=>e.currentTarget.style.background='#1c1624'}>
                <span style={{color:'#1877f2', fontWeight: '900', fontSize: '18px'}}>f</span> Facebook
              </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
              {isRegistering ? 'Already have an account?' : "New here?"}
            </span>
            <span 
              style={{ color: '#d946ef', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginLeft: '6px' }}
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


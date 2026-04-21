import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebaseConfig';
import { CarTaxiFront, LogIn, UserPlus } from 'lucide-react';

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
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Dynamic Background */}
      <div className="login-bg"></div>
      
      <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '420px', padding: '40px 32px', zIndex: 10, position: 'relative' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '20px', border: '1px solid rgba(0, 210, 255, 0.2)', boxShadow: '0 0 20px rgba(0,210,255,0.2)' }}>
             <CarTaxiFront color="var(--primary)" size={48} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>Campus Rides</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginTop: '8px' }}>Sign in to book an E-Rickshaw</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 0, 85, 0.1)', color: 'var(--danger)', border: '1px solid rgba(255,0,85,0.2)', padding: '14px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
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
            <input  
              type="email" 
              placeholder="Campus Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group" style={{ marginBottom: '32px' }}>
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            {isRegistering ? <><UserPlus size={22}/> Register Account</> : <><LogIn size={22}/> Access Terminal</>}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', fontSize: '16px', display: 'inline-block', marginTop: '8px', padding: '4px 8px', borderRadius: '8px', transition: 'background 0.3s' }}
            onClick={() => setIsRegistering(!isRegistering)}
            onMouseOver={(e) => e.target.style.background = 'rgba(0,210,255,0.1)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            {isRegistering ? 'Sign In Instead' : 'Create an Account'}
          </span>
        </div>

      </div>
    </div>
  );
}


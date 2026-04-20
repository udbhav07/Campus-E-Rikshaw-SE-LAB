import React, { useState, useEffect } from 'react';
import { User as UserIcon, Save, X } from 'lucide-react';

export default function Profile({ user, onClose }) {
  const [profileData, setProfileData] = useState({ name: '', email: '', vehicle: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`http://localhost:5000/api/user/${user.uid}`)
      .then(res => res.json())
      .then(data => {
         setProfileData({
             name: data.name || '',
             email: data.email || user.email,
             vehicle: data.campusId || '' // using campusId field to store vehicle temporarily for schema simplicity, or we should update schema
         });
         setLoading(false);
      })
      .catch(err => {
         console.error(err);
         setLoading(false);
      });
  }, [user]);

  const handleSave = (e) => {
      e.preventDefault();
      fetch(`http://localhost:5000/api/user/${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              name: profileData.name,
              campusId: profileData.vehicle // Using campusId field as generic metadata for the driver's vehicle
          })
      })
      .then(res => res.json())
      .then(() => setMessage('Profile updated successfully!'))
      .catch(() => setMessage('Failed to update profile.'));
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
        <div className="top-header" style={{ position: 'relative', top: 0, left: 0, right: 0, padding: '20px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', fontWeight: 'bold' }}>
                <UserIcon color="var(--primary)" /> Driver Profile
            </div>
            <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        <div style={{ padding: '32px', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
            {loading ? <p>Loading profile...</p> : (
                <form onSubmit={handleSave} className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
                    {message && <p style={{ color: 'var(--primary)', marginBottom: '16px', fontWeight: 'bold' }}>{message}</p>}
                    
                    <div className="input-group">
                        <label style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Email (Read Only)</label>
                        <input type="email" value={profileData.email} disabled style={{ opacity: 0.6 }} />
                    </div>

                    <div className="input-group">
                        <label style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Driver Full Name</label>
                        <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                    </div>

                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Registered Vehicle Details</label>
                        <input type="text" value={profileData.vehicle} onChange={e => setProfileData({...profileData, vehicle: e.target.value})} placeholder="e.g., Green Rickshaw HR-26" />
                    </div>

                    <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <Save size={20} /> Save Details
                    </button>
                </form>
            )}
        </div>
    </div>
  );
}

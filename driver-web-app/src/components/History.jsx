import React, { useState, useEffect } from 'react';
import { Clock, X, MapPin, Navigation } from 'lucide-react';

export default function History({ user, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/rides/history/${user.uid}`)
      .then(res => res.json())
      .then(data => {
         setHistory(data);
         setLoading(false);
      })
      .catch(err => {
         console.error(err);
         setLoading(false);
      });
  }, [user]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-color)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
        <div className="top-header" style={{ position: 'relative', top: 0, left: 0, right: 0, padding: '20px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', fontWeight: 'bold' }}>
                <Clock color="var(--primary)" /> Driving History
            </div>
            <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
            {loading ? <p>Loading history...</p> : history.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No completed rides found.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {history.map(ride => (
                        <div key={ride._id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    {new Date(ride.createdAt).toLocaleDateString()}
                                </span>
                                <span style={{ 
                                    padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                                    background: ride.status === 'COMPLETED' ? 'rgba(0,223,130,0.1)' : 'rgba(255,71,87,0.1)',
                                    color: ride.status === 'COMPLETED' ? '#00df82' : '#ff4757'
                                }}>
                                    {ride.status}
                                </span>
                            </div>
                            
                            <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '12px', fontSize: '16px' }}>
                                <strong>Passenger:</strong> {ride.passengerId ? ride.passengerId.name : 'Unknown User'}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                <MapPin size={16} color="var(--primary)" />
                                <span style={{ fontSize: '14px' }}>Picked up from passenger pin</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                <Navigation size={16} color="#ff4757" />
                                <span style={{ fontSize: '14px' }}>Dropped off at passenger destination</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}

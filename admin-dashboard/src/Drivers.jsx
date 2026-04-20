import React, { useEffect, useState } from 'react';

export default function Drivers({ suspensionsOnly = false }) {
    const [drivers, setDrivers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', license: '', vehiclePlate: '' });

    const fetchDrivers = () => {
        fetch('http://localhost:5000/api/admin/drivers')
           .then(res => res.json())
           .then(data => {
               if (Array.isArray(data)) {
                   if (suspensionsOnly) {
                       setDrivers(data.filter(d => !d.isActive));
                   } else {
                       setDrivers(data);
                   }
               } else {
                   console.error("Expected array from /api/admin/drivers but got:", data);
                   setDrivers([]); // Fallback to empty array to avoid .map crash
               }
           })
           .catch(err => {
               console.error(err);
               setDrivers([]);
           });
    };

    useEffect(() => {
        fetchDrivers();
    }, [suspensionsOnly]);

    const toggleSuspend = (id) => {
        fetch(`http://localhost:5000/api/admin/drivers/${id}/suspend`, { method: 'PUT' })
           .then(() => fetchDrivers())
           .catch(console.error);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/admin/register-driver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert("Driver successfully registered!");
                setShowForm(false);
                setFormData({ name: '', email: '', password: '', phone: '', license: '', vehiclePlate: '' });
                fetchDrivers();
            } else {
                const data = await res.json();
                alert("Error: " + data.error);
            }
        } catch(err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '32px', flex: 1, backgroundColor: 'var(--bg-color)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2>{suspensionsOnly ? "Suspended Drivers" : "Fleet Management"}</h2>
                {!suspensionsOnly && (
                    <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--primary)', color: '#000', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                        + Register New Driver
                    </button>
                )}
            </div>

            {showForm && (
                <div style={{ backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--panel-border)' }}>
                    <h3 style={{ marginBottom: '16px' }}>Register Driver</h3>
                    <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff' }} />
                        <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff' }} />
                        <input type="password" placeholder="Password (min 6 chars)" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff' }} />
                        <input type="text" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff' }} />
                        <input type="text" placeholder="License Details" required value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff' }} />
                        <input type="text" placeholder="Vehicle Details / Plate" required value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff' }} />
                        <button type="submit" style={{ gridColumn: 'span 2', background: '#fff', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Complete Registration</button>
                    </form>
                </div>
            )}
            
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--panel-bg)', borderRadius: '16px', overflow: 'hidden' }}>
                <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '16px' }}>Name</th>
                        <th style={{ padding: '16px' }}>Email</th>
                        <th style={{ padding: '16px' }}>Firebase UID</th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {drivers.map(driver => (
                        <tr key={driver._id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                            <td style={{ padding: '16px', fontWeight: 'bold' }}>{driver.name}</td>
                            <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{driver.email}</td>
                            <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>{driver.firebaseUid}</td>
                            <td style={{ padding: '16px' }}>
                                <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '12px',
                                    backgroundColor: driver.isActive ? 'rgba(0,223,130,0.1)' : 'rgba(255,71,87,0.1)',
                                    color: driver.isActive ? '#00df82' : '#ff4757'
                                }}>
                                    {driver.isActive ? 'ACTIVE' : 'SUSPENDED'}
                                </span>
                            </td>
                            <td style={{ padding: '16px' }}>
                                <button 
                                    onClick={() => toggleSuspend(driver._id)}
                                    style={{
                                        background: driver.isActive ? '#ff4757' : '#00df82',
                                        color: driver.isActive ? '#fff' : '#000',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {driver.isActive ? 'Suspend' : 'Reactivate'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {drivers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No drivers found.
                </div>
            )}
        </div>
    );
}

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
        <div className="content-padding">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '32px' }}>{suspensionsOnly ? "Suspended Drivers" : "Fleet Management"}</h2>
                {!suspensionsOnly && (
                    <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--primary)', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)', transition: 'background 0.3s' }} onMouseOver={(e) => e.target.style.background = 'var(--primary-hover)'} onMouseOut={(e) => e.target.style.background = 'var(--primary)'}>
                        + Register New Driver
                    </button>
                )}
            </div>

            {showForm && (
                <div className="data-table-container" style={{ padding: '32px', marginBottom: '32px' }}>
                    <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>Register Driver</h3>
                    <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff', outline: 'none' }} />
                        <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff', outline: 'none' }} />
                        <input type="password" placeholder="Password (min 6 chars)" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff', outline: 'none' }} />
                        <input type="text" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff', outline: 'none' }} />
                        <input type="text" placeholder="License Details" required value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff', outline: 'none' }} />
                        <input type="text" placeholder="Vehicle Details / Plate" required value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: '#fff', outline: 'none' }} />
                        <button type="submit" style={{ gridColumn: 'span 2', background: 'var(--accent)', color: '#000', padding: '16px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px', marginTop: '8px' }}>Complete Registration</button>
                    </form>
                </div>
            )}
            
            <div className="data-table-container" style={{ marginTop: 0 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Driver Name</th>
                            <th>Email Address</th>
                            <th>Firebase UID</th>
                            <th>Status Indicator</th>
                            <th>Administrative Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map(driver => (
                            <tr key={driver._id}>
                                <td>{driver.name}</td>
                                <td>{driver.email}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)' }}>{driver.firebaseUid}</td>
                                <td>
                                    <span className={`badge ${driver.isActive ? 'badge-active' : 'badge-danger'}`}>
                                        {driver.isActive ? 'ACTIVE' : 'SUSPENDED'}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        onClick={() => toggleSuspend(driver._id)}
                                        style={{
                                            background: driver.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: driver.isActive ? '#f87171' : '#34d399',
                                            border: `1px solid ${driver.isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                            padding: '8px 20px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = driver.isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}
                                        onMouseOut={(e) => e.target.style.background = driver.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}
                                    >
                                        {driver.isActive ? 'Suspend' : 'Reactivate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {drivers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        No driver records found.
                    </div>
                )}
            </div>
        </div>
    );
}


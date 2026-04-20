import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Analytics() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/admin/analytics')
           .then(res => res.json())
           .then(setData)
           .catch(console.error);
    }, []);

    if (!data) return <div style={{ padding: 40 }}>Loading Analytics...</div>;

    return (
        <div style={{ padding: '32px', flex: 1, backgroundColor: 'var(--bg-color)', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '24px' }}>System Overview</h2>
            
            <div className="stats-grid" style={{ padding: 0, marginBottom: '32px' }}>
                <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)' }}>Total Rides</span>
                    <span className="stat-value">{data.totals.totalRides}</span>
                </div>
                <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)' }}>Completed Rides</span>
                    <span className="stat-value" style={{ color: '#00df82' }}>{data.totals.completedRides}</span>
                </div>
                <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)' }}>Cancelled Rides</span>
                    <span className="stat-value" style={{ color: '#ff4757' }}>{data.totals.cancelledRides}</span>
                </div>
            </div>

            <div style={{ background: 'var(--panel-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)', height: 400 }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Rides Over Time (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#191c24', border: 'none', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="rides" stroke="#00df82" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

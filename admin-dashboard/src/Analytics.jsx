import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Analytics() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/admin/analytics')
           .then(res => res.json())
           .then(setData)
           .catch(console.error);
    }, []);

    if (!data) return <div className="content-padding">Loading Analytics Data...</div>;

    return (
        <div className="content-padding">
            <h2 style={{ marginBottom: '32px', fontSize: '32px' }}>System Overview</h2>
            
            <div className="stats-grid" style={{ marginBottom: '40px' }}>
                <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Rides</span>
                    <span className="stat-value">{data.totals.totalRides}</span>
                </div>
                <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed Rides</span>
                    <span className="stat-value" style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', WebkitBackgroundClip: 'text' }}>{data.totals.completedRides}</span>
                </div>
                <div className="stat-card">
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cancelled Rides</span>
                    <span className="stat-value" style={{ background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', WebkitBackgroundClip: 'text' }}>{data.totals.cancelledRides}</span>
                </div>
            </div>

            <div className="data-table-container" style={{ padding: '32px', height: 450, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '24px', color: 'var(--text-main)', fontSize: '20px' }}>Rides Activity Timeline (Last 7 Days)</h3>
                <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.chartData}>
                            <defs>
                                <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                            <YAxis stroke="var(--text-muted)" axisLine={false} tickLine={false} dx={-10} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} itemStyle={{ color: 'var(--text-main)' }} />
                            <Area type="monotone" dataKey="rides" stroke="var(--primary)" fillOpacity={1} fill="url(#colorRides)" strokeWidth={3} activeDot={{ r: 8, fill: 'var(--secondary)' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}


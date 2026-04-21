import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Map, Settings, ShieldBan } from 'lucide-react';

export default function Layout({ isConnected, drivers }) {
  const navStyle = ({ isActive }) => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: '14px', 
    textDecoration: 'none',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    fontWeight: isActive ? '700' : '500',
    padding: '14px 18px',
    borderRadius: '12px',
    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
    transition: 'all 0.2s ease-in-out'
  });

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 style={{ color: 'var(--text-main)', marginBottom: '48px', fontSize: '26px', fontWeight: '900', paddingLeft: '16px', letterSpacing: '-0.5px' }}>
          Campus<span style={{ color: 'var(--primary)' }}>Admin</span>
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/" style={navStyle} end>
            <Map size={22} /> Live Map
          </NavLink>
          <NavLink to="/analytics" style={navStyle}>
            <LayoutDashboard size={22} /> Analytics
          </NavLink>
          <NavLink to="/drivers" style={navStyle}>
            <Users size={22} /> Drivers
          </NavLink>
          <NavLink to="/suspensions" style={navStyle}>
            <ShieldBan size={22} /> Suspensions
          </NavLink>
        </div>

        <div style={{ marginTop: 'auto', padding: '20px 16px' }}>
             <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>Campus Rides System v1.0</p>
        </div>
      </div>

      <div className="main-content">
        <div className="top-nav">
          <h1 style={{ fontSize: '22px', color: 'var(--text-main)', fontWeight: '700' }}>Admin Portal</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '100px', border: '1px solid var(--panel-border)' }}>
             <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? 'var(--accent)' : 'var(--danger)', boxShadow: isConnected ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none' }}></div>
             <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px' }}>WS: {isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* Content View is injected here */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <Outlet context={{ drivers }} />
        </div>

      </div>
    </div>
  );
}


import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Map, Settings, ShieldBan } from 'lucide-react';

export default function Layout({ isConnected, drivers }) {
  const navStyle = ({ isActive }) => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    textDecoration: 'none',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    fontWeight: isActive ? 'bold' : 'normal',
    padding: '12px 16px',
    borderRadius: '8px',
    background: isActive ? 'rgba(0, 223, 130, 0.1)' : 'transparent'
  });

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 style={{ color: 'var(--primary)', marginBottom: '48px', fontSize: '24px', fontWeight: '900', paddingLeft: '16px' }}>Campus Admin</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/" style={navStyle} end>
            <Map size={20} /> Live Map
          </NavLink>
          <NavLink to="/analytics" style={navStyle}>
            <LayoutDashboard size={20} /> Analytics
          </NavLink>
          <NavLink to="/drivers" style={navStyle}>
            <Users size={20} /> Drivers
          </NavLink>
          <NavLink to="/suspensions" style={navStyle}>
            <ShieldBan size={20} /> Suspensions
          </NavLink>
        </div>
      </div>

      <div className="main-content">
        <div className="top-nav">
          <h1 style={{ fontSize: '20px' }}>Admin Portal</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? 'var(--primary)' : 'red' }}></div>
             <span style={{ color: 'var(--text-muted)' }}>WS: {isConnected ? 'Live' : 'Offline'}</span>
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

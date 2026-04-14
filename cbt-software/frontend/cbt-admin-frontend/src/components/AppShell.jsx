import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import './AppShell.css';

export default function AppShell() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="app-header">
          <h2 id="page-title">Dashboard</h2>
          <div className="header-actions">
            <span className="search-hint">Press <code>Ctrl + K</code> to search</span>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
}

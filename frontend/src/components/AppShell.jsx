import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex max-w-6xl mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

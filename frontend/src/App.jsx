import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import CreateProject from './pages/CreateProject';
import EditProject from './pages/EditProject';
import ProjectDetail from './pages/ProjectDetail';
import ApplicationsInbox from './pages/ApplicationsInbox';
import MyApplications from './pages/MyApplications';
import MyProjects from './pages/MyProjects';
import Workspace from './pages/Workspace';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import PublicProfile from './pages/PublicProfile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import NotificationsPage from './pages/NotificationsPage';

export default function App() {
  return (
    <Routes>
      {/* auth-flow pages: simple top bar only, no sidebar */}
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/login" element={<><Navbar /><Login /></>} />
      <Route path="/register" element={<><Navbar /><Register /></>} />
      <Route path="/forgot-password" element={<><Navbar /><ForgotPassword /></>} />
      <Route path="/reset-password" element={<><Navbar /><ResetPassword /></>} />

      {/* app pages: top bar + sidebar shell */}
      <Route path="/explore" element={<AppShell><Explore /></AppShell>} />
      <Route path="/create" element={<AppShell><CreateProject /></AppShell>} />
      <Route path="/projects/:id/edit" element={<AppShell><EditProject /></AppShell>} />
      <Route path="/projects/:id" element={<AppShell><ProjectDetail /></AppShell>} />
      <Route path="/projects/:id/applications" element={<AppShell><ApplicationsInbox /></AppShell>} />
      <Route path="/projects/:id/workspace" element={<AppShell><Workspace /></AppShell>} />
      <Route path="/my-applications" element={<AppShell><MyApplications /></AppShell>} />
      <Route path="/my-projects" element={<AppShell><MyProjects /></AppShell>} />
      <Route path="/notifications" element={<AppShell><NotificationsPage /></AppShell>} />
      <Route path="/profile" element={<AppShell><Profile /></AppShell>} />
      <Route path="/profile/edit" element={<AppShell><ProfileEdit /></AppShell>} />
      <Route path="/users/:id" element={<AppShell><PublicProfile /></AppShell>} />
      <Route path="/admin" element={<AppShell><Admin /></AppShell>} />
    </Routes>
  );
}

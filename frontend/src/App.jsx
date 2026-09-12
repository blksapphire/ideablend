import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import usePushNotifications from './hooks/usePushNotifications';
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
import Assistant from './pages/Assistant';
import { AgentProvider } from './context/AgentContext';

export default function App() {
  const { user } = useAuth();
  usePushNotifications(user);
  return (
    <AgentProvider>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/projects/:id/edit" element={<EditProject />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/applications" element={<ApplicationsInbox />} />
          <Route path="/projects/:id/workspace" element={<Workspace />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/users/:id" element={<PublicProfile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/assistant" element={<Assistant />} />
        </Routes>
      </div>
    </AgentProvider>
  );
}

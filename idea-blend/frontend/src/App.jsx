import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import CreateProject from './pages/CreateProject';
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

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<CreateProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/applications" element={<ApplicationsInbox />} />
        <Route path="/projects/:id/workspace" element={<Workspace />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/users/:id" element={<PublicProfile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

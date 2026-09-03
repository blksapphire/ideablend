import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProfileView from '../components/ProfileView';
import SignInPrompt from '../components/SignInPrompt';

export default function Profile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!authUser) return;
    get('/users/me').then(data => {
      setProfile(data);
      get(`/users/${data.id}/reviews`).then(setReviews);
    });
  }, [authUser]);

  if (!authUser) return <SignInPrompt message="Sign in to view your profile." />;
  if (!profile) return <p className="max-w-lg mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <ProfileView profile={profile} reviews={reviews} isOwnProfile />
    </div>
  );
}

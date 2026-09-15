import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProfileView from '../components/ProfileView';

export default function PublicProfile() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    get(`/users/${id}`).then(setProfile);
    get(`/users/${id}/reviews`).then(setReviews);
  }, [id]);

  if (!profile) return <p className="max-w-6xl mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  const isOwnProfile = authUser && authUser.id === profile.id;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <ProfileView profile={profile} reviews={reviews} isOwnProfile={isOwnProfile} />
    </main>
  );
}

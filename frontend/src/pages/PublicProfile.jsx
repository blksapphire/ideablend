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

  if (!profile) return <p className="max-w-lg mx-auto px-6 py-16 text-ink/50 dark:text-ink-dark/50">Loading…</p>;

  const isOwnProfile = authUser && authUser.id === profile.id;

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <ProfileView profile={profile} reviews={reviews} isOwnProfile={isOwnProfile} />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProfileView, { ProfileSkeleton } from '../components/ProfileView';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import useDocumentMeta from '../hooks/useDocumentMeta';

export default function PublicProfile() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useDocumentMeta({
    title: profile?.name || 'Profile',
    description:
      profile?.headline || 'View this builder’s skills, availability, and reviews on Idea Blend.'
  });

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setError('');
    setReviews([]);
    get(`/users/${id}`)
      .then(data => {
        if (cancelled) return;
        setProfile(data);
        get(`/users/${id}/reviews`)
          .then(setReviews)
          .catch(() => setReviews([]));
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Could not load this profile.');
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  if (error) {
    return (
      <main className="mx-auto max-w-shell px-4 py-6 sm:px-6 sm:py-10">
        <EmptyState
          title="This profile could not load"
          description={error}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" onClick={() => setReloadKey(key => key + 1)}>
                Try again
              </Button>
              <Button to="/explore">Back to explore</Button>
            </div>
          }
        />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-shell px-4 py-6 sm:px-6 sm:py-10">
        <ProfileSkeleton />
      </main>
    );
  }

  const isOwnProfile = authUser && authUser.id === profile.id;

  return (
    <main className="mx-auto max-w-shell px-4 py-6 sm:px-6 sm:py-10">
      <ProfileView
        key={profile.id}
        profile={profile}
        reviews={reviews}
        isOwnProfile={isOwnProfile}
      />
    </main>
  );
}

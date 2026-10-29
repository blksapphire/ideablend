import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProfileView, { ProfileSkeleton } from '../components/ProfileView';
import SignInPrompt from '../components/SignInPrompt';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import useDocumentMeta from '../hooks/useDocumentMeta';

export default function Profile() {
  useDocumentMeta({
    title: 'Your profile',
    description: 'Your Idea Blend profile: skills, availability, and reviews from collaborators.'
  });

  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    setError('');
    get('/users/me')
      .then(data => {
        if (cancelled) return;
        setProfile(data);
        get(`/users/${data.id}/reviews`)
          .then(setReviews)
          .catch(() => setReviews([]));
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Could not load your profile.');
      });
    return () => {
      cancelled = true;
    };
  }, [authUser, reloadKey]);

  if (!authUser) return <SignInPrompt message="Sign in to view your profile." />;

  return (
    <main className="mx-auto max-w-shell px-4 py-6 sm:px-6 sm:py-10">
      {error ? (
        <EmptyState
          title="Your profile could not load"
          description={error}
          action={
            <Button variant="secondary" onClick={() => setReloadKey(key => key + 1)}>
              Try again
            </Button>
          }
        />
      ) : !profile ? (
        <ProfileSkeleton />
      ) : (
        <ProfileView profile={profile} reviews={reviews} isOwnProfile />
      )}
    </main>
  );
}

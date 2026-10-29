import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { post } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import { Field, PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import Notice from '../components/ui/Notice';
import useDocumentMeta from '../hooks/useDocumentMeta';

export default function ResetPassword() {
  useDocumentMeta({
    title: 'Set a new password',
    description: 'Choose a new password for your Idea Blend account.'
  });

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout
        kicker="Account recovery"
        title="Reset link is incomplete"
        panel={false}
        footer={
          <p className="mt-5 text-center text-sm text-ui-muted">
            <Link to="/login" className="font-medium text-blue-text dark:text-blue-textdark">
              Back to sign in
            </Link>
          </p>
        }
      >
        <div className="space-y-4">
          <Notice tone="error">Missing reset token. Use the link from your reset email.</Notice>
          <Button to="/forgot-password" variant="secondary" fullWidth>
            Request a new link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      kicker="Account recovery"
      title="Set a new password"
      description="Choose something you have not used before."
      panel={false}
    >
      {done ? (
        <Notice tone="success">Password updated — redirecting to sign in…</Notice>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="New password" hint="At least 8 characters." required>
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="New password"
            />
          </Field>

          {error && <Notice tone="error">{error}</Notice>}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

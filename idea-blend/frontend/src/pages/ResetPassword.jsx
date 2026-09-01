import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { post } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
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
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <p className="text-sm text-ink/60 dark:text-ink-dark/60">Missing reset token. Use the link from your reset email.</p>
        <Link to="/forgot-password" className="text-sm text-violet-text dark:text-violet-textdark font-medium mt-2 inline-block">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-2xl mb-6">Set a new password</h1>
      {done ? (
        <p className="text-sm text-teal-text dark:text-teal-textdark">Password updated — redirecting to sign in…</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="New password"
            className="w-full p-3 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-surface dark:bg-surfacedark" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button disabled={loading} className="w-full p-3 rounded-lg bg-violet dark:bg-violet-dark text-white font-semibold">
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}

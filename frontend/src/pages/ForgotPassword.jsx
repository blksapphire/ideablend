import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await post('/auth/forgot-password', { email });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-2xl mb-6">Reset your password</h1>
      {result ? (
        <div>
          <p className="text-sm text-ink/70 dark:text-ink-dark/70">{result.message}</p>
          {result.devModeResetLink && (
            <div className="mt-4 p-3 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-surface dark:bg-surfacedark">
              <p className="text-xs text-ink/50 dark:text-ink-dark/50 mb-2">No email service is configured yet, so here's your link directly:</p>
              <Link to={result.devModeResetLink.replace(/^https?:\/\/[^/]+/, '')} className="text-sm text-violet-text dark:text-violet-textdark break-all">
                {result.devModeResetLink}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com"
            className="w-full p-3 rounded-lg border border-ink/15 dark:border-ink-dark/15 bg-surface dark:bg-surfacedark" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button disabled={loading} className="w-full p-3 rounded-lg bg-violet dark:bg-violet-dark text-white font-semibold">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="text-sm text-ink/60 dark:text-ink-dark/60 mt-4">
        <Link to="/login" className="text-violet-text dark:text-violet-textdark font-medium">Back to sign in</Link>
      </p>
    </div>
  );
}

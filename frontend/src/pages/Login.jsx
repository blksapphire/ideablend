import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Enter your email and password.');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/explore');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-2xl mb-6">Sign in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark"
        />
        <input
          value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="w-full p-3 rounded-lg bg-violet dark:bg-violet-dark text-white font-semibold">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-ink/60 dark:text-ink-dark/60 mt-3">
        <Link to="/forgot-password" className="text-violet-text dark:text-violet-textdark font-medium">Forgot password?</Link>
      </p>
      <p className="text-sm text-ink/60 dark:text-ink-dark/60 mt-4">
        New here? <Link to="/register" className="text-violet-text dark:text-violet-textdark font-medium">Create an account</Link>
      </p>
    </div>
  );
}

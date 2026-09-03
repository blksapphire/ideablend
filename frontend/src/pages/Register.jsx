import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [fields, setFields] = useState({ name: '', email: '', password: '', skills: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function set(key) {
    return e => setFields(f => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!fields.email || !fields.password) return setError('Email and password are required.');
    setLoading(true);
    try {
      await register(fields);
      navigate('/explore');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-2xl mb-6">Create an account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={fields.name} onChange={set('name')} placeholder="Your name"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.email} onChange={set('email')} type="email" placeholder="you@example.com"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.password} onChange={set('password')} type="password" placeholder="Password"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        <input value={fields.skills} onChange={set('skills')} placeholder="Skills, comma separated"
          className="w-full p-3 rounded-lg border border-ink/25 dark:border-ink-dark/25 bg-surface dark:bg-surfacedark" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="w-full p-3 rounded-lg bg-violet dark:bg-violet-dark text-white font-semibold">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-sm text-ink/60 dark:text-ink-dark/60 mt-4">
        Already have an account? <Link to="/login" className="text-violet-text dark:text-violet-textdark font-medium">Sign in</Link>
      </p>
    </div>
  );
}

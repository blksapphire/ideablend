import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Field, Input, PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import Notice from '../components/ui/Notice';
import useDocumentMeta from '../hooks/useDocumentMeta';

export default function Login() {
  useDocumentMeta({ title: 'Sign in', description: 'Sign in to your Idea Blend account.' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
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
    <AuthLayout
      kicker="Welcome back"
      title="Sign in"
      description="Pick up where you left off."
      footer={
        <p className="mt-5 text-center text-sm text-ui-muted">
          New here?{' '}
          <Link to="/register" className="font-medium text-blue-text dark:text-blue-textdark">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" required>
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Your password"
          />
        </Field>

        <div className="-mt-1 flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-blue-text dark:text-blue-textdark"
          >
            Forgot password?
          </Link>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}

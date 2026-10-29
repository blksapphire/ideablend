import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import { Field, Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import Notice from '../components/ui/Notice';
import useDocumentMeta from '../hooks/useDocumentMeta';

export default function ForgotPassword() {
  useDocumentMeta({
    title: 'Reset your password',
    description: 'Request a password reset link for your Idea Blend account.'
  });

  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
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
    <AuthLayout
      kicker="Account recovery"
      title="Reset your password"
      description="Enter the email on your account and we will send you a reset link."
      footer={
        <p className="mt-5 text-center text-sm text-ui-muted">
          <Link to="/login" className="font-medium text-blue-text dark:text-blue-textdark">
            Back to sign in
          </Link>
        </p>
      }
    >
      {result ? (
        <div className="space-y-4">
          <Notice tone="success">{result.message}</Notice>
          {result.devModeResetLink && (
            <Notice tone="info" title="Development reset link">
              <p className="text-xs">
                No email service is configured yet, so here is your link directly:
              </p>
              <Link
                to={result.devModeResetLink.replace(/^https?:\/\/[^/]+/, '')}
                className="mt-2 block break-all text-xs font-medium underline underline-offset-2"
              >
                {result.devModeResetLink}
              </Link>
            </Notice>
          )}
          <Button to="/login" variant="secondary" fullWidth>
            Back to sign in
          </Button>
        </div>
      ) : (
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

          {error && <Notice tone="error">{error}</Notice>}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

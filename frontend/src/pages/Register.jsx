import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Field, Input, PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import Notice from '../components/ui/Notice';
import useDocumentMeta from '../hooks/useDocumentMeta';

export default function Register() {
  useDocumentMeta({
    title: 'Create an account',
    description: 'Create an Idea Blend account and start finding collaborators for your next project.'
  });

  const [fields, setFields] = useState({ name: '', email: '', password: '', skills: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function set(key) {
    return event => setFields(current => ({ ...current, [key]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
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
    <AuthLayout
      kicker="Join Idea Blend"
      title="Create an account"
      description="Tell people what you build. You can fill in the rest later."
      footer={
        <p className="mt-5 text-center text-sm text-ui-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-text dark:text-blue-textdark">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Name">
          <Input
            autoComplete="name"
            value={fields.name}
            onChange={set('name')}
            placeholder="Your name"
          />
        </Field>

        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={set('email')}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" hint="At least 8 characters." required>
          <PasswordInput
            autoComplete="new-password"
            value={fields.password}
            onChange={set('password')}
            placeholder="Choose a password"
          />
        </Field>

        <Field label="Skills" hint="Separate with commas, e.g. React, product design.">
          <Input
            value={fields.skills}
            onChange={set('skills')}
            placeholder="React, product design"
          />
        </Field>

        {error && <Notice tone="error">{error}</Notice>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}

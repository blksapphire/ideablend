import React from 'react';
import EmptyState from './ui/EmptyState';
import Button from './ui/Button';

export default function SignInPrompt({ message }) {
  return (
    <main className="mx-auto max-w-shell px-6 py-16">
      <EmptyState
        className="mx-auto max-w-lg"
        title="Sign in to continue"
        description={message}
        action={<Button to="/login">Sign in</Button>}
      />
    </main>
  );
}

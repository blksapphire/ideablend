import React from 'react';
import { Link } from 'react-router-dom';

export default function SignInPrompt({ message }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <p className="text-ink/60 dark:text-ink-dark/60 mb-4">{message}</p>
      <Link to="/login" className="inline-block px-5 py-2.5 rounded-lg bg-violet dark:bg-violet-dark text-white text-sm font-semibold">
        Sign in
      </Link>
    </div>
  );
}

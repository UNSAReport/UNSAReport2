import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  getGithubLoginUrlServerFn,
  getGoogleLoginUrlServerFn,
} from '@/lib/auth/server';

export const Route = createFileRoute('/auth/login')({
  component: LoginComponent,
});

function LoginComponent() {
  const [googleUrl, setGoogleUrl] = useState<string>('/api/auth/v1/google');
  const [githubUrl, setGithubUrl] = useState<string>('/api/auth/v1/github');

  useEffect(() => {
    getGoogleLoginUrlServerFn()
      .then(setGoogleUrl)
      .catch(() => {});
    getGithubLoginUrlServerFn()
      .then(setGithubUrl)
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1>Login</h1>
      <p>Sign in via Identity Provider.</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <a href={googleUrl}>
          <button type="button">Login with Google</button>
        </a>
        <a href={githubUrl}>
          <button type="button">Login with GitHub</button>
        </a>
      </div>
      <p>
        Direct endpoints: <code>/api/auth/v1/google</code>,{' '}
        <code>/api/auth/v1/github</code>
      </p>
    </div>
  );
}

import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { requireAuthServerFn } from '@/lib/auth/server';

export const Route = createFileRoute('/registry/upload')({
  beforeLoad: async () => {
    try {
      await requireAuthServerFn();
    } catch {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: UploadComponent,
});

function UploadComponent() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/registry/v1/packages', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        let errMsg = `Upload failed (${res.status})`;
        try {
          const json = (await res.json()) as {
            message?: string;
            error?: string;
          };
          if (json?.message) {
            errMsg = json.message;
          } else if (json?.error) {
            errMsg = json.error;
          }
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
      const data = (await res.json()) as {
        package: string;
        version: string;
        status: string;
      };
      setSuccess(
        `Package "${data.package}" v${data.version} uploaded successfully (Status: ${data.status})`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <h1>Upload Package</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <pre style={{ color: 'green' }}>{success}</pre>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="file" name="file" accept=".zip,.tgz,.tar.gz" required />
        <button type="submit">Upload</button>
      </form>
      <p>
        Requires authentication. Packages must be scoped (e.g.{' '}
        <code>@scope/package-name</code>) and declare an{' '}
        <code>unsareport.toml</code> document. You must be an owner or
        contributor of the target scope.{' '}
        <Link to="/scopes">Manage your scopes and invitations here</Link>.
      </p>
    </div>
  );
}

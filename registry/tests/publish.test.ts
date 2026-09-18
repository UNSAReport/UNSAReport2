import { describe, expect, it, mock } from 'bun:test';
import { eq } from 'drizzle-orm';
import JSZip from 'jszip';
import { db } from '@/db';
import { packages } from '@/db/schema';

mock.module('@/lib/auth', () => ({
  verifyJWT: async () => ({
    id: '00000000-0000-4000-8000-000000000001',
    email: 'publisher@example.com',
    roles: ['user'],
  }),
}));

// Dynamic import: mock.module must register before the app graph loads,
// and static imports hoist above it. Test-only module-loading boundary.
const { default: app } = await import('@/index');

async function buildZip(entries: Record<string, string>): Promise<File> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(entries)) {
    zip.file(path, content);
  }
  const buffer = await zip.generateAsync({ type: 'arraybuffer' });
  return new File([buffer], 'components.zip', { type: 'application/zip' });
}

function postPublish(form: FormData) {
  return app.fetch(
    new Request('http://localhost/v1/packages', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: form,
    }),
  );
}

describe('POST /v1/packages pkg.toml gate', () => {
  it('rejects manifest.json-only uploads with 400', async () => {
    const archive = await buildZip({
      'manifest.json': JSON.stringify({
        name: 'legacy-pkg',
        version: '1.0.0',
        files: ['index.typ'],
      }),
      'index.typ': '#let x = 1',
    });
    const form = new FormData();
    form.append('file', archive);

    const res = await postPublish(form);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    expect(data.message).toMatch(/pkg\.toml/);
  });

  it('rejects uploads with no pkg field and no manifest with 400', async () => {
    const archive = await buildZip({ 'index.typ': '#let x = 1' });
    const form = new FormData();
    form.append('components', archive);

    const res = await postPublish(form);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.message).toMatch(/Missing pkg\.toml/);
  });

  it('rejects invalid pkg.toml text with 400', async () => {
    const archive = await buildZip({ 'lib.typ': '#let x = 1' });
    const form = new FormData();
    form.append('pkg', '[package');
    form.append('components', archive);

    const res = await postPublish(form);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
  });

  it('rejects missing archive with 400', async () => {
    const form = new FormData();
    form.append('pkg', '[package]\nname = "cardo"\n');

    const res = await postPublish(form);
    expect(res.status).toBe(400);
  });

  it('publishes a scoped package and serves it over slash routes', async () => {
    await db.delete(packages).where(eq(packages.name, '@xxx/yyy'));
    try {
      const pkgText = [
        '[package]',
        'name = "@xxx/yyy"',
        'version = "0.0.1"',
        'description = "scoped round-trip"',
        '',
        '[components]',
        'files = ["lib.typ"]',
        '',
      ].join('\n');
      const archive = await buildZip({
        'lib.typ': '#let note(body) = block()[#body]\n',
      });
      const form = new FormData();
      form.append('pkg', pkgText);
      form.append('components', archive);

      const postRes = await postPublish(form);
      expect(postRes.status).toBe(201);
      const posted = (await postRes.json()) as {
        package: string;
        version: string;
      };
      expect(posted.package).toBe('@xxx/yyy');

      const getRes = await app.fetch(
        new Request('http://localhost/v1/packages/@xxx/yyy'),
      );
      expect(getRes.status).toBe(200);
      const fetched = (await getRes.json()) as { name: string };
      expect(fetched.name).toBe('@xxx/yyy');

      const verRes = await app.fetch(
        new Request('http://localhost/v1/packages/@xxx/yyy/0.0.1'),
      );
      expect(verRes.status).toBe(200);
      const ver = (await verRes.json()) as { package: string };
      expect(ver.package).toBe('@xxx/yyy');

      const versionsRes = await app.fetch(
        new Request('http://localhost/v1/packages/@xxx/yyy/versions'),
      );
      expect(versionsRes.status).toBe(200);

      const archiveRes = await app.fetch(
        new Request(
          'http://localhost/v1/@xxx/yyy/0.0.1/archive?section=components',
        ),
      );
      expect(archiveRes.status).toBe(200);
      const archiveBody = (await archiveRes.json()) as { archive_url: string };
      expect(archiveBody.archive_url.startsWith('http')).toBe(true);

      // Non-admin author hits the scoped approve twin and is refused by role
      // (403 proves the route matched; an unmatched path yields Hono's 404).
      const approveRes = await app.fetch(
        new Request(
          'http://localhost/v1/admin/packages/@xxx/yyy/0.0.1/approve',
          {
            method: 'POST',
            headers: { Authorization: 'Bearer test-token' },
          },
        ),
      );
      expect(approveRes.status).toBe(403);
    } finally {
      await db.delete(packages).where(eq(packages.name, '@xxx/yyy'));
    }
  });
});

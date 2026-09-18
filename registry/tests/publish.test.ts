import { describe, expect, it, mock } from 'bun:test';
import JSZip from 'jszip';

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
});

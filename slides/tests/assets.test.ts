import { describe, expect, it, mock } from 'bun:test';
import { getMimeType } from '@/lib/s3';

const mockS3Store = new Map<
  string,
  { body: Uint8Array; contentType: string; eTag: string }
>();

// Pre-populate mock S3
mockS3Store.set('templates/assets/cloudlet-pitch/photo.jpg', {
  body: new TextEncoder().encode('fake-jpg-data'),
  contentType: 'image/jpeg',
  eTag: '"etag-cloudlet-photo"',
});

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => {
    const found = mockS3Store.get(key);
    if (!found) {
      throw new Error(`NoSuchKey: ${key}`);
    }
    return {
      body: found.body,
      contentType: found.contentType,
      contentLength: found.body.byteLength,
      eTag: found.eTag,
    };
  },
  deleteS3Object: async () => {},
  deleteS3Prefix: async () => {},
  getPresignedUrl: async (key: string) => `http://localhost/s3/${key}`,
  ensureBucketExists: async () => {},
  getMimeType,
}));

// Dynamic import after mock.module
const { default: app } = await import('@/index');

describe('GET /assets/templates/:packId/:filename', () => {
  it('sirve un asset existente con 200, Content-Type, ETag y Cache-Control inmutable', async () => {
    const res = await app.fetch(
      new Request('http://localhost/assets/templates/cloudlet-pitch/photo.jpg'),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/jpeg');
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(res.headers.get('etag')).toBe('"etag-cloudlet-photo"');

    const bodyText = await res.text();
    expect(bodyText).toBe('fake-jpg-data');
  });

  it('devuelve 304 Not Modified cuando If-None-Match coincide con el ETag', async () => {
    const res = await app.fetch(
      new Request(
        'http://localhost/assets/templates/cloudlet-pitch/photo.jpg',
        {
          headers: {
            'if-none-match': '"etag-cloudlet-photo"',
          },
        },
      ),
    );
    expect(res.status).toBe(304);
  });

  it('devuelve 404 para un asset inexistente', async () => {
    const res = await app.fetch(
      new Request(
        'http://localhost/assets/templates/cloudlet-pitch/nonexistent.png',
      ),
    );
    expect(res.status).toBe(404);
  });

  it('devuelve 400 para packId inválido', async () => {
    const res = await app.fetch(
      new Request('http://localhost/assets/templates/INVALID_PACK/photo.jpg'),
    );
    expect(res.status).toBe(400);
  });

  it('devuelve 400 para filename malicioso o con path traversal', async () => {
    const res = await app.fetch(
      new Request(
        'http://localhost/assets/templates/cloudlet-pitch/..evil.jpg',
      ),
    );
    expect(res.status).toBe(400);
  });
});

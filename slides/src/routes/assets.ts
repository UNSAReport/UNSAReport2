import { Hono } from 'hono';
import { getMimeType, getS3Object } from '@/lib/s3';
import { NotFoundError, ValidationError } from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

const assetsRouter = new Hono<HonoEnv>();

const PACK_ID_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FILENAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

function etagMatches(ifNoneMatch: string, eTag: string): boolean {
  const strongETag = eTag.replace(/^W\//, '');
  return ifNoneMatch
    .split(',')
    .map((tag) => tag.trim().replace(/^W\//, ''))
    .some((tag) => tag === '*' || tag === strongETag);
}

/**
 * GET /assets/templates/:packId/:filename
 *
 * Sirve assets estáticos de plantillas alojados en SeaweedFS S3.
 * Expuesto a través de Traefik en /api/slides/assets/templates/:packId/:filename.
 */
assetsRouter.get('/templates/:packId/:filename', async (c) => {
  const packId = c.req.param('packId');
  const filename = c.req.param('filename');

  if (!packId || !PACK_ID_REGEX.test(packId)) {
    throw new ValidationError(`Invalid packId "${packId}": must be kebab-case`);
  }

  if (
    !filename ||
    !FILENAME_REGEX.test(filename) ||
    filename.includes('..') ||
    filename.startsWith('.')
  ) {
    throw new ValidationError(`Invalid filename "${filename}"`);
  }

  const s3Key = `templates/assets/${packId}/${filename}`;

  try {
    const s3Object = await getS3Object(s3Key);

    const headers: Record<string, string> = {
      'Content-Type': s3Object.contentType || getMimeType(filename),
      'Cache-Control': 'public, max-age=31536000, immutable',
    };
    if (s3Object.contentLength !== undefined) {
      headers['Content-Length'] = String(s3Object.contentLength);
    }
    if (s3Object.eTag) {
      headers.ETag = s3Object.eTag;
    }

    const ifNoneMatch = c.req.header('if-none-match');
    if (
      s3Object.eTag &&
      ifNoneMatch &&
      etagMatches(ifNoneMatch, s3Object.eTag)
    ) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(new Uint8Array(s3Object.body), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('NoSuchKey') ||
      message.includes('NotFound') ||
      message.includes('has no body')
    ) {
      throw new NotFoundError(
        `Template asset not found: ${packId}/${filename}`,
      );
    }
    // Si s3 Client falla por objeto inexistente
    throw new NotFoundError(`Template asset not found: ${packId}/${filename}`);
  }
});

export default assetsRouter;

import { and, eq } from 'drizzle-orm';
import { type Context, Hono } from 'hono';
import { db } from '@/db/index';
import { orgMembers, presentations, presentationVersions } from '@/db/schema';
import { stripBearer, verifyCredential } from '@/lib/auth';
import { getMimeType, getS3Object } from '@/lib/s3';
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/middleware/error-handler';
import type { HonoEnv, SlidesUser } from '@/types';

const embedRouter = new Hono<HonoEnv>();

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolvePresentation(paramId: string) {
  // UUID path stays canonical. Slug path honors the /presentations/<slug>
  // contract (docs/slides.md section 7): slugs are scoped per
  // (ownerType, ownerId), so return the row by UUID, or the first slug row
  // when the id is not a UUID. checkAccess runs after resolution either way,
  // so slug-addressed embeds pass authz identically to UUID embeds.
  if (UUID_REGEX.test(paramId)) {
    const [byId] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, paramId))
      .limit(1);

    if (!byId) {
      throw new NotFoundError('Presentation not found');
    }

    return byId;
  }

  const candidates = await db
    .select()
    .from(presentations)
    .where(eq(presentations.slug, paramId))
    .limit(10);

  const [first] = candidates;
  if (!first) {
    throw new NotFoundError('Presentation not found');
  }

  return first;
}

// Embed access is intentionally visibility-based, not role-based: public and
// unlisted presentations serve without credentials, while private/org decks
// require ownership or org membership below. No slides role check happens
// here, so viewer tokens can read any deck they are entitled to see.
// Doctrine note: GET /presentations/:id hides existence (404 for invisible
// decks) while embed enforces (401 anonymous / 403 authenticated-but-denied).
// The 403s are pinned by embed.test.ts, so the difference is intentional —
// do NOT "close the oracle" by aligning embed to 404.
async function checkAccess(
  c: Context<HonoEnv>,
  presentation: typeof presentations.$inferSelect,
) {
  const isPublic =
    presentation.visibility === 'public' ||
    presentation.visibility === 'unlisted';

  if (isPublic) {
    return;
  }

  const authHeader = c.req.header('Authorization');
  const queryToken = c.req.query('token');
  const token = stripBearer(authHeader) || queryToken;

  if (!token) {
    throw new UnauthorizedError(
      'Authentication required to view this presentation',
    );
  }

  let user: SlidesUser;
  try {
    user = await verifyCredential(token);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AuthUpstreamError') {
      throw new AppError(
        err.message || 'Authentication service unavailable',
        503,
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new UnauthorizedError(message || 'Invalid authentication token');
  }

  let allowed = false;
  if (presentation.ownerType === 'user' && presentation.ownerId === user.id) {
    allowed = true;
  } else if (presentation.ownerType === 'organization') {
    const [membership] = await db
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, presentation.ownerId),
          eq(orgMembers.userId, user.id),
        ),
      )
      .limit(1);
    if (membership) {
      allowed = true;
    }
  } else if (
    presentation.visibility === 'org' &&
    presentation.ownerType === 'user'
  ) {
    const ownerOrgIds = await db
      .select({ orgId: orgMembers.orgId })
      .from(orgMembers)
      .where(eq(orgMembers.userId, presentation.ownerId));

    if (ownerOrgIds.length > 0) {
      const callerOrgIds = await db
        .select({ orgId: orgMembers.orgId })
        .from(orgMembers)
        .where(eq(orgMembers.userId, user.id));

      const callerSet = new Set(callerOrgIds.map((m) => m.orgId));
      if (ownerOrgIds.some((m) => callerSet.has(m.orgId))) {
        allowed = true;
      }
    }
  }

  if (!allowed) {
    throw new ForbiddenError('You do not have access to this presentation');
  }
}

// Subpath is parsed from the /:id/:version/ boundary, not from the first
// "/vN/" match: a slug id may itself contain a "v<N>" segment (e.g. id "v1"
// in /embed/v1/v1/index.html), so anchoring on "/<id>/" keeps the split
// exact. Both spellings ("v1" and "1") are accepted to cover the
// /:id/v:version/* and /:id/:version/* route shapes.
function extractSubpath(
  path: string,
  paramId: string,
  versionNumber: number,
): string {
  const markers = [
    `/${paramId}/v${versionNumber}/`,
    `/${paramId}/${versionNumber}/`,
  ];
  for (const marker of markers) {
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      return path.slice(idx + marker.length);
    }
  }
  return '';
}

// Fallback ETag derived from the exact bytes served (Express-style weak
// etag), so conditional GET keeps working when the storage backend reports
// no ETag (e.g. S3 doubles in unit tests).
function weakETag(body: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < body.length; i++) {
    hash ^= body[i] ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return `W/"${body.length.toString(16)}-${(hash >>> 0).toString(16)}"`;
}

function etagMatches(ifNoneMatch: string, eTag: string): boolean {
  const strongETag = eTag.replace(/^W\//, '');
  return ifNoneMatch
    .split(',')
    .map((tag) => tag.trim().replace(/^W\//, ''))
    .some((tag) => tag === '*' || tag === strongETag);
}

async function handleEmbed(c: Context<HonoEnv>) {
  const paramId = c.req.param('id');
  if (!paramId) {
    throw new ValidationError('Presentation ID or slug is required');
  }
  const rawVersion = c.req.param('version') || '1';
  if (!/^v?\d+$/.test(rawVersion)) {
    throw new ValidationError(`Invalid version number "${rawVersion}"`);
  }
  const versionNumber = Number.parseInt(rawVersion.replace(/^v/, ''), 10);

  if (Number.isNaN(versionNumber) || versionNumber < 1) {
    throw new ValidationError(`Invalid version number "${rawVersion}"`);
  }

  const rawSubpath =
    extractSubpath(c.req.path, paramId, versionNumber) || c.req.param('*');
  let filePath = rawSubpath ? rawSubpath.trim() : 'index.html';
  if (!filePath || filePath.endsWith('/')) {
    filePath = `${filePath}index.html`;
  }
  filePath = filePath.replace(/^\/+/, '');

  // Decode percent-escapes before the traversal check so an encoded ".."
  // (%2e%2e in any case mix) cannot smuggle past the literal match.
  let decodedPath = filePath;
  try {
    decodedPath = decodeURIComponent(filePath);
  } catch {
    throw new ValidationError('Invalid file path: malformed encoding');
  }

  if (decodedPath.includes('..')) {
    throw new ValidationError('Invalid file path: path traversal detected');
  }

  const presentation = await resolvePresentation(paramId);
  await checkAccess(c, presentation);

  const [versionRecord] = await db
    .select()
    .from(presentationVersions)
    .where(
      and(
        eq(presentationVersions.presentationId, presentation.id),
        eq(presentationVersions.versionNumber, versionNumber),
      ),
    )
    .limit(1);

  if (!versionRecord) {
    throw new NotFoundError(
      `Version v${versionNumber} not found for presentation "${presentation.slug}"`,
    );
  }

  const prefix =
    versionRecord.bundleS3Prefix ||
    `presentations/${presentation.id}/v${versionNumber}/`;
  const s3Key = `${prefix}${filePath}`;

  try {
    const s3Object = await getS3Object(s3Key);
    // Serve the ContentType persisted at upload time (deploy stores the real
    // MIME per file via uploadS3Object); fall back to extension sniffing for
    // legacy objects stored as the S3/generic default or backends that
    // report no ContentType.
    const storedType = s3Object.contentType;
    const contentType =
      storedType && storedType !== 'application/octet-stream'
        ? storedType
        : getMimeType(filePath);

    const isHtml = filePath.endsWith('.html') || filePath.endsWith('.htm');
    const isPublic =
      presentation.visibility === 'public' ||
      presentation.visibility === 'unlisted';
    const cacheControl = isPublic
      ? isHtml
        ? 'public, max-age=0, must-revalidate'
        : 'public, max-age=31536000, immutable'
      : isHtml
        ? 'private, max-age=0, must-revalidate'
        : 'private, max-age=3600, must-revalidate';

    // Rewrite root-absolute asset refs so the bundle works when served from
    // the versioned embed prefix (/embed/<id>/vN/...) instead of the domain
    // root. Vite emits href/src="/assets/..." and public-dir refs like
    // "/img.png"; inside the iframe those would 404 at the host origin.
    // "./" keeps them relative to the embed version directory (auth for
    // sub-assets travels via the session cookie through the web proxy).
    let body: Buffer = Buffer.from(s3Object.body);
    const isJs = filePath.endsWith('.js') || filePath.endsWith('.mjs');
    const isCss = filePath.endsWith('.css');
    if (isHtml || isJs || isCss) {
      const text = body.toString('utf-8');
      // 1. Static markup: src/href="/assets/..." and public files "/img.png".
      // 2. JS string literals: imageUrl:'/img.png' in the app bundle (deck
      //    configs reference public-dir images with root-absolute paths).
      // Root-absolute refs break inside the iframe: the bundle is served from
      // the versioned embed prefix (/embed/<id>/vN/...), so "/x" escapes to
      // the host origin and 404s. "./" keeps refs relative to the version
      // directory (auth travels via session cookie through the web proxy).
      let rewritten = text
        .replaceAll(
          /((?:src|href)=["'])\/(assets\/[^"']+|[^"'/][^"']*\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|mp4|webm|pdf|js|mjs|css|map|json|txt|xml|wasm))/gi,
          '$1./$2',
        )
        .replaceAll(
          /((?:imageUrl|image|src|poster)\s*:\s*["'])\/((?:assets\/[^"']+|[^"'/][^"']*\.(?:png|jpe?g|gif|svg|webp|avif|ico|mp4|webm)))(["'])/gi,
          '$1./$2$3',
        )
        // Minified bundles escape quotes (imageUrl:\"/x.png\"); escaped
        // pass so those refs resolve under the embed prefix too.
        .replaceAll(
          /((?:imageUrl|image|src|poster)\s*:\s*\\["'])\/((?:assets\/[^\\"']+|[^\\"'/][^\\"']*\.(?:png|jpe?g|gif|svg|webp|avif|ico|mp4|webm)))(\\["'])/gi,
          '$1./$2$3',
        );
      // HTML srcset: rewrite the leading "/img-480.png ..." candidate so
      // responsive images resolve under the embed prefix.
      if (isHtml) {
        rewritten = rewritten.replaceAll(
          /((?:srcset)=["']\s*)\/(?!\/)/gi,
          '$1./',
        );
      }
      // Stylesheets (and inline <style> blocks in HTML): rewrite
      // url(/bg.png) / url("/fonts/x.woff2") so CSS assets resolve under
      // the embed prefix. Protocol-relative ("//"), data:, and absolute
      // http(s) URLs are left untouched.
      if (isCss || isHtml) {
        rewritten = rewritten.replaceAll(
          /(url\(\s*)(["']?)\/(?!\/)/gi,
          '$1$2./',
        );
      }
      body = Buffer.from(rewritten);
    }
    // Anchor every relative URL (including query strings and future dynamic
    // refs) to the versioned embed directory, so nothing escapes to the host
    // origin regardless of how the bundle references it.
    if (isHtml) {
      let text = body.toString('utf-8');
      // Never duplicate an existing <base>: match the tag itself, not a
      // "<base" substring inside other markup (e.g. "<baseline>").
      if (!/<base[\s>/]/i.test(text)) {
        const base = `<base href="./">`;
        if (/<head[^>]*>/i.test(text)) {
          text = text.replace(/<head([^>]*)>/i, `<head$1>\n    ${base}`);
        } else if (/<html[^>]*>/i.test(text)) {
          // Document without <head>: create one so <base> has a valid home.
          text = text.replace(
            /<html([^>]*)>/i,
            `<html$1>\n<head>\n    ${base}\n</head>`,
          );
        }
        // Headless fragments (no <html>/<head>) are served byte-identical:
        // there is no document element to anchor a <base> to, and
        // embed.test.ts pins passthrough for those responses.
        body = Buffer.from(text);
      }
    }

    const eTag = s3Object.eTag || weakETag(body);

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Content-Length': String(body.length),
      ETag: eTag,
      'X-Content-Type-Options': 'nosniff',
    };
    const isPrivate =
      presentation.visibility !== 'public' &&
      presentation.visibility !== 'unlisted';
    if (isPrivate) {
      responseHeaders.Vary = 'Authorization';
    }

    const ifNoneMatch = c.req.header('If-None-Match');
    if (ifNoneMatch && etagMatches(ifNoneMatch, eTag)) {
      const notModifiedHeaders: Record<string, string> = {
        ETag: eTag,
        'Cache-Control': cacheControl,
      };
      if (isPrivate) {
        notModifiedHeaders.Vary = 'Authorization';
      }
      return new Response(null, { status: 304, headers: notModifiedHeaders });
    }

    return new Response(new Uint8Array(body), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('NoSuchKey') || message.includes('NotFound')) {
      throw new NotFoundError(
        `Asset "${filePath}" not found in presentation v${versionNumber}`,
      );
    }
    throw err;
  }
}

// Canonical mount is /embed; /presentations/embed is a legacy alias (both
// mounted in src/index.ts). The subpath is parsed from the /:id/:version/
// boundary, so both mounts share these handlers with no route changes.
embedRouter.get('/:id/v:version/*', handleEmbed);
embedRouter.get('/:id/v:version', handleEmbed);
embedRouter.get('/:id/:version/*', handleEmbed);
embedRouter.get('/:id/:version', handleEmbed);

export default embedRouter;

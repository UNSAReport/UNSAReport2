import { and, eq } from 'drizzle-orm';
import { type Context, Hono } from 'hono';
import { db } from '@/db/index';
import { orgMembers, presentations, presentationVersions } from '@/db/schema';
import { stripBearer, verifyCredential } from '@/lib/auth';
import { getMimeType, getS3Object } from '@/lib/s3';
import {
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
  // Canonical lookup is by presentation UUID. Slugs are scoped per
  // (ownerType, ownerId), not globally unique, so slug resolution here was
  // ambiguous across owners. Web clients always address embeds by id
  // (embedSrc uses presentation.id); slugs stay write-only metadata.
  if (!UUID_REGEX.test(paramId)) {
    throw new NotFoundError('Presentation not found');
  }
  const [presentation] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, paramId))
    .limit(1);

  if (!presentation) {
    throw new NotFoundError('Presentation not found');
  }

  return presentation;
}

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

function extractSubpath(path: string, versionNumber: number): string {
  const vPrefix = `/v${versionNumber}/`;
  const plainPrefix = `/${versionNumber}/`;
  const vIdx = path.indexOf(vPrefix);
  if (vIdx !== -1) return path.slice(vIdx + vPrefix.length);
  const plainIdx = path.indexOf(plainPrefix);
  if (plainIdx !== -1) return path.slice(plainIdx + plainPrefix.length);
  return '';
}

async function handleEmbed(c: Context<HonoEnv>) {
  const paramId = c.req.param('id');
  if (!paramId) {
    throw new ValidationError('Presentation ID or slug is required');
  }
  const rawVersion = c.req.param('version') || '1';
  const versionNumber = Number.parseInt(rawVersion.replace(/^[vV]/, ''), 10);

  if (Number.isNaN(versionNumber) || versionNumber < 1) {
    throw new ValidationError(`Invalid version number "${rawVersion}"`);
  }

  const rawSubpath =
    extractSubpath(c.req.path, versionNumber) || c.req.param('*');
  let filePath = rawSubpath ? rawSubpath.trim() : 'index.html';
  if (!filePath || filePath.endsWith('/')) {
    filePath = `${filePath}index.html`;
  }
  filePath = filePath.replace(/^\/+/, '');

  if (filePath.includes('..')) {
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
    const contentType = getMimeType(filePath);

    const isHtml = filePath.endsWith('.html') || filePath.endsWith('.htm');
    const cacheControl = isHtml
      ? 'public, max-age=0, must-revalidate'
      : 'public, max-age=31536000, immutable';

    // Rewrite root-absolute asset refs so the bundle works when served from
    // the versioned embed prefix (/embed/<id>/vN/...) instead of the domain
    // root. Vite emits href/src="/assets/..." and public-dir refs like
    // "/img.png"; inside the iframe those would 404 at the host origin.
    // "./" keeps them relative to the embed version directory (auth for
    // sub-assets travels via the session cookie through the web proxy).
    let body: Buffer = Buffer.from(s3Object.body);
    const isJs = filePath.endsWith('.js') || filePath.endsWith('.mjs');
    if (isHtml || isJs) {
      const text = body.toString('utf-8');
      // 1. Static markup: src/href="/assets/..." and public files "/img.png".
      // 2. JS string literals: imageUrl:'/img.png' in the app bundle (deck
      //    configs reference public-dir images with root-absolute paths).
      // Root-absolute refs break inside the iframe: the bundle is served from
      // the versioned embed prefix (/embed/<id>/vN/...), so "/x" escapes to
      // the host origin and 404s. "./" keeps refs relative to the version
      // directory (auth travels via session cookie through the web proxy).
      body = Buffer.from(
        text
          .replaceAll(
            /((?:src|href)=["'])\/(assets\/[^"']+|[^"'/][^"']*\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|mp4|webm|pdf|json|txt|xml))/gi,
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
          ),
      );
    }
    // Anchor every relative URL (including query strings and future dynamic
    // refs) to the versioned embed directory, so nothing escapes to the host
    // origin regardless of how the bundle references it.
    if (isHtml) {
      const text = body.toString('utf-8');
      const base = `<base href="./">`;
      body = Buffer.from(
        text.includes('<base')
          ? text
          : text.replace(/<head([^>]*)>/i, `<head$1>\n    ${base}`),
      );
    }

    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'Content-Length': String(body.length),
        'X-Content-Type-Options': 'nosniff',
      },
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

embedRouter.get('/:id/v:version/*', handleEmbed);
embedRouter.get('/:id/v:version', handleEmbed);
embedRouter.get('/:id/:version/*', handleEmbed);
embedRouter.get('/:id/:version', handleEmbed);

export default embedRouter;

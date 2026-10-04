import { createHash } from 'node:crypto';
import {
  type CliDeployRequest,
  CliDeployRequestSchema,
  type CliDeployResponse,
} from '@unsa/schemas/cli-api';
import { SlideManifestSchema } from '@unsa/schemas/manifest';
import { PresentationVisibilitySchema } from '@unsa/schemas/presentations';
import { and, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import JSZip from 'jszip';
import { z } from 'zod';
import { config } from '@/config';
import { db } from '@/db/index';
import {
  organizations,
  orgMembers,
  presentations,
  presentationVersions,
} from '@/db/schema';
import { deleteS3Prefix, getMimeType, uploadS3Object } from '@/lib/s3';
import {
  requireAuth,
  requireSlidesEditor,
  requireSlidesRole,
} from '@/middleware/auth';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  isUniqueViolationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

// Zip-bomb guardrails for deployed bundles (checked while walking the ZIP
// entries in validateBundleOrThrow, before any S3 upload).
const MAX_UNCOMPRESSED_TOTAL_BYTES = 200 * 1024 * 1024; // 200 MiB total
const MAX_SINGLE_FILE_BYTES = 25 * 1024 * 1024; // 25 MiB per entry
const MAX_ZIP_ENTRY_COUNT = 2000;
// Cheap Content-Length pre-check for deploys (60 MiB): rejects obviously
// oversized bodies before buffering. Precise caps still run on real bytes.
const MAX_DEPLOY_CONTENT_LENGTH_BYTES = 60 * 1024 * 1024;

// In-memory per-user sliding window for deploy rate limiting (20/min).
// NOTE: single-instance scope only — counters live in this process, so a
// multi-instance deployment would enforce the limit per instance. A shared
// store (e.g. Redis) would be needed for a global limit.
const DEPLOY_WINDOW_MS = 60_000;
const DEPLOY_MAX_PER_WINDOW = 20;
const deployAttemptsByUser = new Map<string, number[]>();

function checkDeployRateLimitOrThrow(userId: string): void {
  const now = Date.now();
  const attempts = deployAttemptsByUser.get(userId) ?? [];
  const recent = attempts.filter((t) => now - t < DEPLOY_WINDOW_MS);
  if (recent.length >= DEPLOY_MAX_PER_WINDOW) {
    deployAttemptsByUser.set(userId, recent);
    throw new RateLimitError(
      `Deploy rate limit exceeded: max ${DEPLOY_MAX_PER_WINDOW} deploys per minute`,
    );
  }
  recent.push(now);
  deployAttemptsByUser.set(userId, recent);
}

function isValidBase64(value: string): boolean {
  const compact = value.replace(/\s+/g, '');
  if (compact.length === 0) return true;
  if (compact.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/_-]*={0,2}$/.test(compact);
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DeployStore = Pick<typeof db, 'select' | 'update' | 'insert'>;
type DeployAllocation = { presentationId: string; nextVersion: number };
interface TransactionalDeployStore extends DeployStore {
  transaction(
    fn: (tx: DeployStore) => Promise<DeployAllocation>,
  ): Promise<DeployAllocation>;
}

async function validateBundleOrThrow(
  bundleBuffer: Buffer,
): Promise<{ path: string; buffer: Buffer }[]> {
  if (bundleBuffer.length === 0) {
    throw new ValidationError('Bundle file is empty (0 bytes)');
  }
  const isZipArchive =
    bundleBuffer.length >= 4 &&
    bundleBuffer[0] === 0x50 &&
    bundleBuffer[1] === 0x4b &&
    ((bundleBuffer[2] === 0x03 && bundleBuffer[3] === 0x04) ||
      (bundleBuffer[2] === 0x05 && bundleBuffer[3] === 0x06) ||
      (bundleBuffer[2] === 0x07 && bundleBuffer[3] === 0x08));
  if (!isZipArchive) {
    throw new ValidationError(
      'Invalid bundle: file is not a ZIP archive (bad magic bytes)',
    );
  }
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bundleBuffer);
  } catch {
    throw new ValidationError('Invalid bundle: corrupt or unreadable ZIP file');
  }
  const files: { path: string; buffer: Buffer }[] = [];
  let hasIndex = false;
  let entryCount = 0;
  let totalUncompressedBytes = 0;
  for (const filePath of Object.keys(zip.files)) {
    const entry = zip.files[filePath];
    entryCount += 1;
    if (entryCount > MAX_ZIP_ENTRY_COUNT) {
      throw new AppError(
        `Invalid bundle: ZIP archive contains more than ${MAX_ZIP_ENTRY_COUNT} files`,
        413,
      );
    }
    const cleanPath = filePath.replace(/^\/+/, '');
    // Zip-slip guard: reject the whole bundle (400, naming the entry)
    // instead of silently skipping — a skipped index.html otherwise
    // surfaces later as a mystery 404. Percent-encoded ".." (%2e%2e,
    // any casing) is decoded before the check so it cannot slip through.
    let decodedPath = cleanPath;
    try {
      decodedPath = decodeURIComponent(cleanPath);
    } catch {
      // Undecodable bytes: fall through to the raw-path check below.
    }
    if (cleanPath.includes('..') || decodedPath.includes('..')) {
      throw new ValidationError(
        `Invalid bundle: entry "${filePath}" contains forbidden ".." path segment`,
      );
    }
    if (entry.dir) continue;
    if (cleanPath === 'index.html' || cleanPath.endsWith('/index.html')) {
      hasIndex = true;
    }
    const fileBuffer = Buffer.from(await entry.async('nodebuffer'));
    if (fileBuffer.length > MAX_SINGLE_FILE_BYTES) {
      throw new AppError(
        `Invalid bundle: entry "${cleanPath}" (${fileBuffer.length} bytes) exceeds the per-file limit of ${MAX_SINGLE_FILE_BYTES} bytes`,
        413,
      );
    }
    totalUncompressedBytes += fileBuffer.length;
    if (totalUncompressedBytes > MAX_UNCOMPRESSED_TOTAL_BYTES) {
      throw new AppError(
        `Invalid bundle: total uncompressed size exceeds the limit of ${MAX_UNCOMPRESSED_TOTAL_BYTES} bytes`,
        413,
      );
    }
    files.push({ path: cleanPath, buffer: fileBuffer });
  }
  if (!hasIndex) {
    throw new ValidationError(
      'Invalid bundle: ZIP archive must contain an index.html entrypoint',
    );
  }
  return files;
}

async function isPresentationVisibleTo(
  presentation: typeof presentations.$inferSelect,
  userId: string,
): Promise<boolean> {
  if (presentation.ownerType === 'user' && presentation.ownerId === userId) {
    return true;
  }
  if (presentation.ownerType === 'organization') {
    const [membership] = await db
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, presentation.ownerId),
          eq(orgMembers.userId, userId),
        ),
      )
      .limit(1);
    if (membership) {
      return true;
    }
  }
  if (
    presentation.visibility === 'public' ||
    presentation.visibility === 'unlisted'
  ) {
    return true;
  }
  if (presentation.visibility === 'org' && presentation.ownerType === 'user') {
    const ownerOrgIds = await db
      .select({ orgId: orgMembers.orgId })
      .from(orgMembers)
      .where(eq(orgMembers.userId, presentation.ownerId));
    if (ownerOrgIds.length > 0) {
      const callerOrgIds = await db
        .select({ orgId: orgMembers.orgId })
        .from(orgMembers)
        .where(eq(orgMembers.userId, userId));
      const callerSet = new Set(callerOrgIds.map((m) => m.orgId));
      if (ownerOrgIds.some((m) => callerSet.has(m.orgId))) {
        return true;
      }
    }
  }
  return false;
}

const presentationsRouter = new Hono<HonoEnv>();

presentationsRouter.use('*', requireAuth, requireSlidesRole);

async function resolveOwner(
  userId: string,
  orgSlug: string | undefined,
): Promise<{ ownerType: 'user' | 'organization'; ownerId: string }> {
  if (!orgSlug) {
    return { ownerType: 'user', ownerId: userId };
  }

  // Malformed org slugs are a client error (400), not a lookup miss: only
  // well-formed slugs reach the DB, so a well-formed-but-unknown slug
  // keeps the 404 path below.
  if (!/^[a-z0-9-]{2,100}$/.test(orgSlug)) {
    throw new ValidationError(
      `Invalid orgSlug "${orgSlug}": must match /^[a-z0-9-]{2,100}$/`,
    );
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  if (!org) {
    throw new NotFoundError(`Organization with slug "${orgSlug}" not found`);
  }

  const [membership] = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role === 'viewer') {
    throw new ForbiddenError(
      `You do not have permission to deploy presentations to organization "${org.name}"`,
    );
  }

  return { ownerType: 'organization', ownerId: org.id };
}

presentationsRouter.post('/deploy', requireSlidesEditor, async (c) => {
  const user = c.get('user');
  checkDeployRateLimitOrThrow(user?.id || '');
  // Cheap pre-check before buffering: when the client declares a body
  // larger than 60 MiB, fail fast with 413. The precise caps
  // (config.maxArchiveBytes, per-entry/total uncompressed limits) still run
  // on the real bytes below.
  const declaredLength = c.req.header('content-length');
  if (declaredLength !== undefined && declaredLength !== '') {
    const parsedLength = Number.parseInt(declaredLength, 10);
    if (
      Number.isInteger(parsedLength) &&
      parsedLength > MAX_DEPLOY_CONTENT_LENGTH_BYTES
    ) {
      throw new AppError(
        `Deploy payload (${parsedLength} bytes declared) exceeds the limit of ${MAX_DEPLOY_CONTENT_LENGTH_BYTES} bytes`,
        413,
      );
    }
  }
  const contentType = c.req.header('content-type') || '';

  let payload: CliDeployRequest;
  let bundleBuffer: Buffer;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const bundleField = formData.get('bundle') || formData.get('file');

    if (!bundleField) {
      throw new ValidationError('Missing bundle file in multipart form data');
    }

    if (typeof bundleField === 'string') {
      bundleBuffer = Buffer.from(bundleField, 'base64');
    } else {
      bundleBuffer = Buffer.from(await bundleField.arrayBuffer());
    }

    const metadataRaw = formData.get('metadata');
    let metaObj: Record<string, unknown> = {};
    if (typeof metadataRaw === 'string') {
      try {
        metaObj = JSON.parse(metadataRaw);
      } catch {
        throw new ValidationError('Invalid JSON in metadata field');
      }
    }

    const manifestRaw = formData.get('manifest');
    let manifestObj: unknown = metaObj.manifest;
    if (manifestRaw !== null && manifestRaw !== undefined) {
      if (typeof manifestRaw === 'string') {
        if (manifestRaw !== '') {
          try {
            manifestObj = JSON.parse(manifestRaw);
          } catch {
            throw new ValidationError('Invalid JSON in manifest field');
          }
        }
      } else if (typeof (manifestRaw as Blob).text === 'function') {
        const manifestText = await (manifestRaw as Blob).text();
        if (manifestText !== '') {
          try {
            manifestObj = JSON.parse(manifestText);
          } catch {
            throw new ValidationError('Invalid JSON in manifest field');
          }
        }
      } else {
        throw new ValidationError('Invalid manifest field');
      }
    }

    const textField = (key: string): string | undefined => {
      const value = formData.get(key);
      if (typeof value === 'string' && value !== '') return value;
      const fallback = metaObj[key];
      if (typeof fallback === 'string' && fallback !== '') return fallback;
      return undefined;
    };

    // Multipart uploads carry the ZIP as a File/Blob plus flat text fields,
    // so validate metadata without the JSON base64 `bundle` string and
    // default a missing manifest from slug/title. ZIP safety checks
    // (0-byte/magic/index.html) still run on the raw bytes below.
    const multipartMetaSchema = z.object({
      slug: z
        .string()
        .min(2)
        .max(100)
        .regex(/^[a-z0-9-]+$/),
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      orgSlug: z.string().optional(),
      visibility: PresentationVisibilitySchema.default('private'),
      manifest: SlideManifestSchema.optional(),
    });

    const parsed = multipartMetaSchema.safeParse({
      slug: textField('slug'),
      title: textField('title'),
      description: textField('description'),
      orgSlug: textField('orgSlug'),
      visibility: textField('visibility'),
      manifest: manifestObj,
    });

    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }
    const manifest =
      parsed.data.manifest ??
      SlideManifestSchema.parse({
        name: parsed.data.slug,
        title: parsed.data.title,
      });
    payload = {
      ...parsed.data,
      manifest,
      bundle: '',
    };
  } else {
    const body = await c.req.json().catch(() => ({}));
    const parsed = CliDeployRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }
    payload = parsed.data;
    if (!isValidBase64(payload.bundle)) {
      throw new ValidationError('Invalid base64 in bundle field');
    }
    bundleBuffer = Buffer.from(payload.bundle, 'base64');
  }

  if (bundleBuffer.length > config.maxArchiveBytes) {
    throw new ValidationError(
      `Bundle size (${bundleBuffer.length} bytes) exceeds maximum limit of ${config.maxArchiveBytes} bytes`,
    );
  }

  const bundleFiles = await validateBundleOrThrow(bundleBuffer);

  const buildHash = createHash('sha256').update(bundleBuffer).digest('hex');

  const { ownerType, ownerId } = await resolveOwner(
    user?.id || '',
    payload.orgSlug,
  );

  // Serialize same-(owner,slug) deploys: reserve the next version AND its
  // version row inside one DB transaction while holding a row lock
  // (SELECT FOR UPDATE), so concurrent deploys cannot mint the same version
  // and activeVersion never points at a missing version row. S3 bytes upload
  // after the commit; a loser either blocks on the lock (then mints the
  // next version) or hits a unique violation mapped to 409 below.
  const allocateVersion = async (
    client: DeployStore,
    lockRow: boolean,
  ): Promise<DeployAllocation> => {
    const pending = client
      .select()
      .from(presentations)
      .where(
        and(
          eq(presentations.ownerType, ownerType),
          eq(presentations.ownerId, ownerId),
          eq(presentations.slug, payload.slug),
        ),
      )
      .limit(1);
    // Production postgres takes SELECT FOR UPDATE here; unit-test DB doubles
    // have no row locking, so they read without it.
    const [locked] = lockRow ? await pending.for('update') : await pending;

    if (locked) {
      const version = locked.activeVersion + 1;
      await client
        .update(presentations)
        .set({
          title: payload.title,
          description: payload.description || locked.description,
          visibility: payload.visibility || locked.visibility,
          activeVersion: version,
          updatedAt: new Date(),
        })
        .where(eq(presentations.id, locked.id));
      await client.insert(presentationVersions).values({
        presentationId: locked.id,
        versionNumber: version,
        entrypointUrl: `/embed/${locked.id}/v${version}`,
        manifest: payload.manifest as Record<string, unknown>,
        bundleS3Prefix: `presentations/${locked.id}/v${version}/`,
        bundleSizeBytes: bundleBuffer.length,
        buildHash,
        deployedBy: user?.id || '',
      });
      return { presentationId: locked.id, nextVersion: version };
    }

    const [created] = await client
      .insert(presentations)
      .values({
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        ownerType,
        ownerId,
        visibility: payload.visibility || 'private',
        activeVersion: 1,
      })
      .returning({ id: presentations.id });
    if (!created) {
      throw new ValidationError('Failed to create presentation');
    }
    await client.insert(presentationVersions).values({
      presentationId: created.id,
      versionNumber: 1,
      entrypointUrl: `/embed/${created.id}/v1`,
      manifest: payload.manifest as Record<string, unknown>,
      bundleS3Prefix: `presentations/${created.id}/v1/`,
      bundleSizeBytes: bundleBuffer.length,
      buildHash,
      deployedBy: user?.id || '',
    });
    return { presentationId: created.id, nextVersion: 1 };
  };

  let presentationId: string;
  let nextVersion: number;
  try {
    // Unit-test DB doubles expose no `transaction`; run inline there.
    // Production postgres always provides it, so the row lock applies.
    const runner: DeployStore & Partial<TransactionalDeployStore> = db;
    if (typeof runner.transaction === 'function') {
      ({ presentationId, nextVersion } = await runner.transaction((tx) =>
        allocateVersion(tx, true),
      ));
    } else {
      ({ presentationId, nextVersion } = await allocateVersion(db, false));
    }
  } catch (err) {
    if (isUniqueViolationError(err)) {
      throw new ConflictError(
        'Presentation version conflict; please retry the deploy',
      );
    }
    throw err;
  }

  const s3Prefix = `presentations/${presentationId}/v${nextVersion}/`;
  try {
    for (const file of bundleFiles) {
      const mimeType = getMimeType(file.path);
      await uploadS3Object(`${s3Prefix}${file.path}`, file.buffer, mimeType);
    }
    await uploadS3Object(
      `${s3Prefix}bundle.zip`,
      bundleBuffer,
      'application/zip',
    );
  } catch (err) {
    // Crash window: the version row was committed before S3 uploads, so a
    // failure here would leave a half-written prefix behind — best-effort
    // delete, then rethrow. The cleanup itself never masks the original
    // error.
    try {
      await deleteS3Prefix(s3Prefix);
    } catch {
      // Ignore cleanup failures: the original deploy error propagates.
    }
    throw err;
  }

  // Reconcile the versioned embed URL per deploy so entrypointUrl never
  // goes stale: the canonical embed path is /embed/<id>/v<version>.
  await db
    .update(presentationVersions)
    .set({ entrypointUrl: `/embed/${presentationId}/v${nextVersion}` })
    .where(
      and(
        eq(presentationVersions.presentationId, presentationId),
        eq(presentationVersions.versionNumber, nextVersion),
      ),
    );

  // Canonical viewer URL is UUID-addressed: slugs are scoped per
  // (ownerType, ownerId), not globally unique, so slug URLs were ambiguous.
  const response: CliDeployResponse = {
    success: true,
    presentationId,
    slug: payload.slug,
    version: nextVersion,
    url: `${config.baseUrl}/presentations/${presentationId}`,
    message: `Successfully deployed version v${nextVersion} of "${payload.title}"`,
  };
  return c.json(response);
});

presentationsRouter.get('/', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';

  const rawLimit = c.req.query('limit');
  const rawOffset = c.req.query('offset');
  let limit = 50;
  let offset = 0;
  if (rawLimit !== undefined) {
    limit = Number.parseInt(rawLimit, 10);
    if (!Number.isInteger(limit) || limit < 0) {
      throw new ValidationError(`Invalid limit query parameter "${rawLimit}"`);
    }
    if (limit > 200) limit = 200;
  }
  if (rawOffset !== undefined) {
    offset = Number.parseInt(rawOffset, 10);
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError(
        `Invalid offset query parameter "${rawOffset}"`,
      );
    }
  }

  const own = await db
    .select()
    .from(presentations)
    .where(
      and(
        eq(presentations.ownerType, 'user'),
        eq(presentations.ownerId, userId),
      ),
    );

  const memberships = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId));

  let orgSlots: typeof own = [];
  if (memberships.length > 0) {
    const orgIds = memberships.map((m) => m.orgId);
    orgSlots = await db
      .select()
      .from(presentations)
      .where(
        and(
          eq(presentations.ownerType, 'organization'),
          inArray(presentations.ownerId, orgIds),
        ),
      );
  }

  // Public decks are listable by everyone ("public (listada)"), not just
  // their owners: include visibility=public rows beyond own/org-member rows.
  const publicDecks = await db
    .select()
    .from(presentations)
    .where(eq(presentations.visibility, 'public'));

  // Dedupe by id (own/org/public sets may overlap), then paginate in memory
  // so unit-test DB doubles — which ignore WHERE/LIMIT chaining — behave.
  const seen = new Set<string>();
  const merged: typeof own = [];
  for (const deck of [...own, ...orgSlots, ...publicDecks]) {
    if (seen.has(deck.id)) continue;
    seen.add(deck.id);
    merged.push(deck);
  }

  return c.json({ presentations: merged.slice(offset, offset + limit) });
});

// Speaker notes travel inside the version manifest (`manifest.notes`,
// Record<slideId, notes>). Surface them as a top-level `notes` map so
// viewers can read `version.notes` without digging into the manifest.
// Always an object ({} when the manifest predates notes or has none).
function extractVersionNotes(manifest: unknown): Record<string, string> {
  if (manifest && typeof manifest === 'object' && !Array.isArray(manifest)) {
    const raw = (manifest as Record<string, unknown>).notes;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const notes: Record<string, string> = {};
      for (const [slideId, text] of Object.entries(raw)) {
        if (typeof text === 'string') notes[slideId] = text;
      }
      return notes;
    }
  }
  return {};
}

presentationsRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const id = c.req.param('id');

  // /presentations/<slug> contract (docs/slides.md section 7): slugs are
  // scoped per (ownerType, ownerId), so pick the first slug row the caller
  // may see — the same visibility/authz check as the UUID path.
  let presentation: typeof presentations.$inferSelect | undefined;
  if (UUID_REGEX.test(id)) {
    const [byId] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, id))
      .limit(1);
    presentation = byId;
  } else {
    const candidates = await db
      .select()
      .from(presentations)
      .where(eq(presentations.slug, id))
      .limit(10);
    for (const candidate of candidates) {
      if (await isPresentationVisibleTo(candidate, userId)) {
        presentation = candidate;
        break;
      }
    }
    presentation ??= candidates[0];
  }

  if (!presentation) {
    throw new NotFoundError('Presentation not found');
  }

  if (!(await isPresentationVisibleTo(presentation, userId))) {
    throw new NotFoundError('Presentation not found');
  }
  const versions = await db
    .select()
    .from(presentationVersions)
    .where(eq(presentationVersions.presentationId, presentation.id));

  // Contract (S1-2): { versions: [{ versionNumber, manifest, notes? }] }.
  // `notes` mirrors `manifest.notes` at the top level so viewers can read
  // `version.notes` directly; always an object, never null/undefined.
  // Sorted ascending by version so redeploys append at the end; in memory
  // (not ORDER BY) so unit-test DB doubles behave identically.
  // `buildHash` (sha256 of the bundle bytes, stored per version) rides
  // along via the spread below so clients can detect idempotent redeploys.
  // NOTE: same-hash redeploys currently still mint a new version row;
  // no content-addressed dedup happens here.
  const versionsWithNotes = [...versions]
    .sort((a, b) => a.versionNumber - b.versionNumber)
    .map((v) => ({
      ...v,
      buildHash: v.buildHash ?? null,
      notes: extractVersionNotes(v.manifest),
    }));

  return c.json({ presentation, versions: versionsWithNotes });
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  visibility: PresentationVisibilitySchema.optional(),
  thumbnailUrl: z.url().nullable().optional(),
});

presentationsRouter.patch('/:id', requireSlidesEditor, async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const id = c.req.param('id');

  // Same gate as GET: a non-UUID id can never hit the driver, so it 404s
  // instead of surfacing raw driver text as a 500.
  if (!UUID_REGEX.test(id)) {
    throw new NotFoundError('Presentation not found');
  }

  const [presentation] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, id))
    .limit(1);

  if (!presentation) {
    throw new NotFoundError('Presentation not found');
  }

  await assertCanManage(userId, presentation.ownerType, presentation.ownerId);

  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }
  const data = parsed.data;

  await db
    .update(presentations)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
      ...(data.thumbnailUrl !== undefined
        ? { thumbnailUrl: data.thumbnailUrl }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(presentations.id, id));

  const [updated] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, id))
    .limit(1);

  return c.json({ presentation: updated });
});

presentationsRouter.delete('/:id', requireSlidesEditor, async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const id = c.req.param('id');

  if (!UUID_REGEX.test(id)) {
    throw new NotFoundError('Presentation not found');
  }

  const [presentation] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, id))
    .limit(1);

  if (!presentation) {
    throw new NotFoundError('Presentation not found');
  }

  await assertCanManage(userId, presentation.ownerType, presentation.ownerId);

  await deleteS3Prefix(`presentations/${id}/`);
  await db.delete(presentations).where(eq(presentations.id, id));

  return c.json({ success: true, message: 'Presentation deleted' });
});

async function assertCanManage(
  userId: string,
  ownerType: string,
  ownerId: string,
): Promise<void> {
  if (ownerType === 'user') {
    if (ownerId !== userId) {
      throw new ForbiddenError(
        'Only the owning user can manage this presentation',
      );
    }
    return;
  }

  const [membership] = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, ownerId), eq(orgMembers.userId, userId)))
    .limit(1);

  // Same membership check as the deploy org rule (resolveOwner): any org
  // member except viewers (owner/admin/member) may manage
  // organization-owned decks. Personal-deck rules above are unchanged.
  if (!membership || membership.role === 'viewer') {
    throw new ForbiddenError(
      'Only organization members can manage this presentation',
    );
  }
}

export default presentationsRouter;

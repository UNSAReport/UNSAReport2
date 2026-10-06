import JSZip from 'jszip';

// Shared doubles + fixtures for the slides route tests. Each test file MUST
// keep its own mock.module() calls (registered before the app import);
// this module only exports the factory functions and data those calls need,
// so mock state and helper logic stay identical across files.
//
// Imported as @/fixtures — tsconfig maps @/* to src/* and tests/*.

export const OWNER_ID = '11111111-1111-4111-8111-111111111111';
export const STRANGER_ID = '22222222-2222-4222-8222-222222222222';

export const BOOM_MARKER = 'P0-BOOM-MARKER-9f3c';

// Valid ZIP containing index.html (same fixture shape as deploy.test.ts).
export const VALID_ZIP_B64 =
  'UEsDBAoAAAAAAHGkQ10neOmFDgAAAA4AAAAKAAAAaW5kZXguaHRtbDxoMT5IZWxsbzwvaDE+UEsBAhQACgAAAAAAcaRDXSd46YUOAAAADgAAAAoAAAAAAAAAAAAAAAAAAAAAAGluZGV4Lmh0bWxQSwUGAAAAAAEAAQA4AAAANgAAAAAA';

export const validManifest = {
  name: 'p0-deck',
  title: 'P0 Deck',
  slides: [{ id: 'intro', index: 0, title: 'Intro' }],
};

export type DbFailureMode = 'none' | 'invalid-uuid' | 'unique' | 'boom';

export interface MockDbState {
  presentations: Record<string, unknown>[];
  versions: Record<string, unknown>[];
  orgMembers: Record<string, unknown>[];
  failureMode: DbFailureMode;
  sequence: number;
}

export function createMockDbState(): MockDbState {
  return {
    presentations: [],
    versions: [],
    orgMembers: [],
    failureMode: 'none',
    sequence: 0,
  };
}

export function resetMockDbState(state: MockDbState) {
  state.presentations = [];
  state.versions = [];
  state.orgMembers = [];
  state.failureMode = 'none';
}

// Per-key S3 body overrides (empty by default, so tests without overrides
// keep the canned '<h1>Hello</h1>' body).
export interface S3BodyOverride {
  text: string;
  contentType?: string;
  eTag?: string;
}

function tableName(table: Record<string, unknown> | unknown): string {
  if (typeof table === 'object' && table !== null) {
    return String(
      (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')],
    );
  }
  return '';
}

// Builds the in-memory db double used by mock.module('@/db/index').
// Reads/writes the given state object so tests can seed and reset it.
export function createMockDb(state: MockDbState, ownerId: string) {
  return {
    select: () => ({
      from: (table: Record<string, unknown> | unknown) => {
        const name = tableName(table);
        const getItems = () => {
          if (name === 'presentation_versions') return state.versions;
          if (name === 'org_members') return state.orgMembers;
          return state.presentations;
        };
        return {
          where: () => {
            if (state.failureMode === 'invalid-uuid') {
              throw new Error('invalid input syntax for type uuid: "abc"');
            }
            if (state.failureMode === 'boom') {
              throw new Error(
                `driver exploded ${BOOM_MARKER} conn postgres://internal/db`,
              );
            }
            const items = getItems();
            const promise = Promise.resolve(items);
            return Object.assign(promise, {
              limit: (n: number) => Promise.resolve(items.slice(0, n)),
            });
          },
        };
      },
    }),
    insert: (table: Record<string, unknown> | unknown) => ({
      values: (record: Record<string, unknown>) => {
        if (state.failureMode === 'unique') {
          throw new Error(
            'duplicate key value violates unique constraint "owner_slug_uniq" (23505)',
          );
        }
        const insertName = tableName(table);
        if (insertName === 'presentations') {
          state.sequence += 1;
          const id = `a41d9440-eca6-4812-8521-dea0ded5c0${String(state.sequence).padStart(2, '0')}`;
          state.presentations.push({
            id,
            slug: record.slug,
            title: record.title,
            description: record.description,
            visibility: record.visibility ?? 'private',
            ownerType: record.ownerType ?? 'user',
            ownerId: record.ownerId ?? ownerId,
          });
          return Object.assign(Promise.resolve(undefined), {
            returning: () => Promise.resolve([{ id }]),
          });
        }
        state.versions.push({
          id: `ver-p0-${state.sequence}`,
          presentationId: record.presentationId,
          versionNumber: record.versionNumber ?? 1,
          entrypointUrl: record.entrypointUrl,
          bundleS3Prefix: record.bundleS3Prefix,
          bundleSizeBytes: record.bundleSizeBytes ?? 1024,
          buildHash: record.buildHash,
          manifest: record.manifest,
          deployedBy: record.deployedBy,
        });
        return Object.assign(Promise.resolve(undefined), {
          returning: () =>
            Promise.resolve([{ id: `ver-p0-${state.sequence}` }]),
        });
      },
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  };
}

export function verifyTestCredential(
  token: string,
  opts: {
    ownerToken: string;
    strangerToken: string;
    ownerId?: string;
    strangerId?: string;
    rateIsolatedPrefix?: string;
  },
) {
  const ownerId = opts.ownerId ?? OWNER_ID;
  const strangerId = opts.strangerId ?? STRANGER_ID;
  if (token === opts.ownerToken) {
    return { id: ownerId, roles: { slides: 'editor' } };
  }
  if (token === opts.strangerToken) {
    return { id: strangerId, roles: { slides: 'viewer' } };
  }
  // Rate-budget isolation: POST /presentations/deploy allows 20/min per
  // user (check runs before validation), so each deploy-validation case
  // gets its own synthetic user + window via a per-case token prefix.
  if (opts.rateIsolatedPrefix && token.startsWith(opts.rateIsolatedPrefix)) {
    return {
      id: `rate-user-${token.slice(opts.rateIsolatedPrefix.length)}`,
      roles: { slides: 'editor' },
    };
  }
  throw new Error('Token verification failed: invalid token');
}

export function getMimeType(filePath: string) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.mp4')) return 'video/mp4';
  if (filePath.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

export function getMockS3Object(
  bodies: Map<string, S3BodyOverride>,
  key: string,
) {
  const override = bodies.get(key);
  if (override) {
    return {
      body: new TextEncoder().encode(override.text),
      contentType: override.contentType,
      eTag: override.eTag,
    };
  }
  return {
    body: new TextEncoder().encode('<h1>Hello</h1>'),
    contentType: key.endsWith('.js')
      ? 'application/javascript; charset=utf-8'
      : 'text/html; charset=utf-8',
  };
}

export async function zipToB64(
  build: (zip: JSZip) => void,
  genOpts?: {
    compression?: 'STORE' | 'DEFLATE';
    compressionOptions?: { level: number };
  },
): Promise<string> {
  const zip = new JSZip();
  build(zip);
  const buf = await zip.generateAsync({ type: 'nodebuffer', ...genOpts });
  return Buffer.from(buf as unknown as Uint8Array).toString('base64');
}

// JSZip normalizes `..` segments on load, so a JSZip-built traversal
// fixture never contains `..` when the route re-reads it. This crafts a
// minimal stored (no-compression) ZIP by hand with correct CRC32/sizes.
let rawZipCrcTable: Uint32Array | null = null;
function crc32Bytes(buf: Uint8Array): number {
  let table = rawZipCrcTable;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1)
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    rawZipCrcTable = table;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function rawStoredZipB64(
  entries: { name: string; text: string }[],
): string {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const pushU16 = (arr: number[], v: number) => {
    arr.push(v & 0xff, (v >>> 8) & 0xff);
  };
  const pushU32 = (arr: number[], v: number) => {
    arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  };
  for (const { name, text } of entries) {
    const nameBytes = enc.encode(name);
    const dataBytes = enc.encode(text);
    const crc = crc32Bytes(dataBytes);
    const local: number[] = [];
    pushU32(local, 0x04034b50);
    pushU16(local, 20);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU32(local, crc);
    pushU32(local, dataBytes.length);
    pushU32(local, dataBytes.length);
    pushU16(local, nameBytes.length);
    pushU16(local, 0);
    const localHead = new Uint8Array(local);
    chunks.push(localHead, nameBytes, dataBytes);
    const cen: number[] = [];
    pushU32(cen, 0x02014b50);
    pushU16(cen, 20);
    pushU16(cen, 20);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU32(cen, crc);
    pushU32(cen, dataBytes.length);
    pushU32(cen, dataBytes.length);
    pushU16(cen, nameBytes.length);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU32(cen, 0);
    pushU32(cen, offset);
    central.push(new Uint8Array(cen), nameBytes);
    offset += localHead.length + nameBytes.length + dataBytes.length;
  }
  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end: number[] = [];
  pushU32(end, 0x06054b50);
  pushU16(end, 0);
  pushU16(end, 0);
  pushU16(end, entries.length);
  pushU16(end, entries.length);
  pushU32(end, centralSize);
  pushU32(end, offset);
  pushU16(end, 0);
  const total = offset + centralSize + end.length;
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of [...chunks, ...central, new Uint8Array(end)]) {
    out.set(c, at);
    at += c.length;
  }
  return Buffer.from(out).toString('base64');
}
